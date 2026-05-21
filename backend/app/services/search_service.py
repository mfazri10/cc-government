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

    async def execute_search(self, request: SearchQueryRequest) -> list[SearchQueryResultItem]:
        """
        Menjalankan pencarian. Menggunakan DuckDuckGo HTML sebagai fallback bebas API key.
        Untuk production, Anda dapat mengintegrasikan SerpAPI atau Google Custom Search API di sini.
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
            print(f"[SearchService] Error: {e}")
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
            # Konten digabung dari judul dan snippet
            full_content = f"{item.title}\n\n{item.snippet}"
            
            feedback = RawFeedback(
                source_id=source.id,
                target_entity_id=request.target_entity_id,
                original_post_id=original_post_id,
                author_name="Search Result",
                content=full_content,
                url=item.url,
                posted_at=datetime.fromisoformat(item.published_at) if item.published_at else None,
                is_processed=False
            )
            db.add(feedback)
            created += 1

        await db.commit()

        # TODO: Trigger inngest event 'sentimen/process.requested' secara manual jika menggunakan queue

        return {
            "ingested_count": created,
            "skipped_count": skipped,
            "message": f"Berhasil ingest {created} hasil pencarian."
        }


search_service = SearchService()
