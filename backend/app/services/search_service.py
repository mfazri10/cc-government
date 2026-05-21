import hashlib
import json
from datetime import datetime
from uuid import UUID

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.search import SearchQueryRequest, SearchQueryResultItem, SearchIngestRequest
from app.core.models import RawFeedback, Source
from app.core.exceptions import NotFoundException, ValidationException


class SearchService:
    """Service untuk menangani pencarian dari sumber eksternal dan ingestion."""

    async def execute_search(self, db: AsyncSession, request: SearchQueryRequest) -> list[SearchQueryResultItem]:
        """
        Menjalankan pencarian. Menggunakan Google Serper API jika ada key terkonfigurasi.
        DuckDuckGo HTML sebagai fallback bebas API key.
        """
        query = request.query
        
        # Tambahkan filter site jika user memilih sumber spesifik
        if request.sources:
            if "Berita Lokal" in request.sources:
                query += " (site:detik.com OR site:kompas.com OR site:pikiran-rakyat.com)"
            elif "Twitter / X" in request.sources:
                query += " site:twitter.com OR site:x.com"
            elif "Instagram" in request.sources:
                query += " site:instagram.com"

        # --- Dynamic Key Configuration ---
        api_key = None
        try:
            from app.core.models import SystemSetting
            result = await db.execute(
                select(SystemSetting).where(SystemSetting.key == "SERPER_API_KEY")
            )
            setting = result.scalar_one_or_none()
            if setting and setting.value.strip():
                api_key = setting.value.strip()
        except Exception:
            pass

        if not api_key:
            from app.core.config import get_settings
            settings = get_settings()
            if getattr(settings, "SERPER_API_KEY", ""):
                api_key = settings.SERPER_API_KEY

        # --- Opsi C: Serper API Premium Search ---
        if api_key:
            try:
                serper_url = "https://google.serper.dev/search"
                headers = {
                    "X-API-KEY": api_key,
                    "Content-Type": "application/json"
                }
                payload = {"q": query, "num": request.limit}
                
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(serper_url, json=payload, headers=headers)
                    response.raise_for_status()
                    data = response.json()
                    
                    results = []
                    for item in data.get("organic", [])[:request.limit]:
                        real_url = item.get("link")
                        title = item.get("title", "")
                        snippet = item.get("snippet", "")
                        published_at = item.get("date")
                        
                        source_label = "Web Search"
                        if "twitter.com" in real_url or "x.com" in real_url:
                            source_label = "Twitter / X"
                        elif "instagram.com" in real_url:
                            source_label = "Instagram"
                        elif "detik.com" in real_url or "kompas.com" in real_url or "pikiran-rakyat.com" in real_url:
                            source_label = "Berita Lokal"
                            
                        results.append(SearchQueryResultItem(
                            title=title,
                            url=real_url,
                            snippet=snippet,
                            source=source_label,
                            published_at=published_at
                        ))
                    if results:
                        return results
            except Exception as e:
                print(f"[SearchService] Serper API error: {e}. Falling back to DuckDuckGo.")

        # --- Fallback: DuckDuckGo Scraper ---
        url = "https://html.duckduckgo.com/html/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, data={"q": query}, headers=headers)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, 'html.parser')
                results = []

                # Ekstrak hasil dari struktur HTML DuckDuckGo
                for result in soup.select('.result')[:request.limit]:
                    title_elem = result.select_one('.result__title a')
                    snippet_elem = result.select_one('.result__snippet')
                    url_elem = result.select_one('.result__url')

                    if title_elem and snippet_elem:
                        title = title_elem.text.strip()
                        snippet = snippet_elem.text.strip()
                        
                        raw_link = title_elem.get('href')
                        real_url = url_elem.text.strip() if url_elem else raw_link
                        
                        if not real_url.startswith('http'):
                            real_url = "https://" + real_url.strip()

                        # Deteksi source type sederhana
                        source_label = "Web Search"
                        if "twitter.com" in real_url or "x.com" in real_url:
                            source_label = "Twitter / X"
                        elif "instagram.com" in real_url:
                            source_label = "Instagram"
                        elif "detik.com" in real_url or "kompas.com" in real_url or "pikiran-rakyat.com" in real_url:
                            source_label = "Berita Lokal"

                        results.append(SearchQueryResultItem(
                            title=title,
                            url=real_url,
                            snippet=snippet,
                            source=source_label
                        ))

                if not results:
                    return self._fallback_mock_results(query)
                return results

        except Exception as e:
            print(f"[SearchService] DuckDuckGo Error: {e}")
            return self._fallback_mock_results(query)

    def _fallback_mock_results(self, query: str) -> list[SearchQueryResultItem]:
        """Memberikan mock data jika request ke mesin pencari diblokir."""
        return [
            SearchQueryResultItem(
                title=f"Warga Keluhkan {query} di Pusat Kota",
                url="https://example.com/news/1",
                snippet=f"Berita terbaru mengenai {query} yang sedang menjadi perbincangan hangat di kalangan masyarakat Cimahi hari ini.",
                source="Berita Lokal",
                published_at=datetime.utcnow().isoformat()
            ),
            SearchQueryResultItem(
                title=f"Update Info: {query} dari Pemerintah",
                url="https://example.com/update",
                snippet=f"Menanggapi isu {query}, dinas terkait telah melakukan pengecekan lapangan.",
                source="Web Search"
            )
        ]

    async def ingest_search_results(self, db: AsyncSession, request: SearchIngestRequest) -> dict:
        """
        Menyimpan hasil pencarian terpilih langsung ke tabel raw_feedbacks.
        Menarik artikel penuh menggunakan Jina Reader jika memungkinkan.
        """
        created = 0
        skipped = 0

        for item in request.items:
            # 1. Cari source berdasarkan label pencarian, atau default ke ID pertama
            source_result = await db.execute(select(Source).where(Source.name == item.source))
            source = source_result.scalar_one_or_none()
            
            if not source:
                # Fallback ke source pertama di database
                fallback = await db.execute(select(Source).limit(1))
                source = fallback.scalar_one_or_none()
                if not source:
                    raise ValidationException("Tidak ada source di database.")

            # 2. Buat ID unik (hash dari url + judul)
            original_post_id = hashlib.sha256(f"search::{item.url}::{item.title}".encode()).hexdigest()[:64]

            # 3. Cek duplikasi
            existing = await db.execute(
                select(RawFeedback.id).where(RawFeedback.original_post_id == original_post_id)
            )
            if existing.scalar_one_or_none():
                skipped += 1
                continue

            # 4. Insert feedback
            # Konten fallback digabung dari judul dan snippet
            full_content = f"{item.title}\n\n{item.snippet}"
            
            # Coba ambil konten penuh menggunakan Jina Reader jika bertipe website/berita
            if item.url and not any(x in item.url for x in ["twitter.com", "x.com", "instagram.com", "facebook.com", "example.com"]):
                jina_url = f"https://r.jina.ai/{item.url}"
                try:
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        scrape_resp = await client.get(jina_url, headers={"Accept": "text/markdown"})
                        if scrape_resp.status_code == 200 and scrape_resp.text:
                            clean_md = scrape_resp.text.strip()
                            if len(clean_md) > 100:
                                # Berhasil menarik artikel penuh, batasi panjang teks
                                full_content = clean_md[:15000]
                except Exception as e:
                    print(f"[SearchService] Jina Reader failed for {item.url}: {e}. Falling back to snippet.")

            posted_dt = None
            if item.published_at:
                try:
                    posted_dt = datetime.fromisoformat(item.published_at.replace("Z", "+00:00"))
                except Exception:
                    pass

            feedback = RawFeedback(
                source_id=source.id,
                target_entity_id=request.target_entity_id,
                original_post_id=original_post_id,
                author_name="Search Result",
                content=full_content,
                url=item.url,
                posted_at=posted_dt,
                is_processed=False
            )
            db.add(feedback)
            created += 1

        await db.commit()

        # Pemicu analisis sentimen otomatis secara asinkron
        if created > 0:
            try:
                from app.inngest_fns.client import inngest_client
                import inngest
                await inngest_client.send(
                    inngest.Event(
                        name="sentimen/process.requested",
                        data={},
                    )
                )
            except Exception as e:
                print(f"[SearchService] Failed to trigger sentiment Inngest event: {e}")

        return {
            "ingested_count": created,
            "skipped_count": skipped,
            "message": f"Berhasil ingest {created} hasil pencarian."
        }


search_service = SearchService()
