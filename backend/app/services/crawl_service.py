"""
Service Layer: Crawl Engine.
Sesuai backend-patterns.md Section 1B:
- Semua logika bisnis crawling berada di sini.
- Agnostik terhadap HTTP.
- Menyediakan fungsi pemetaan sitemap, pembersihan HTML, pencarian tautan, dan pelacakan riwayat perayapan.
"""

import re
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse
from uuid import UUID

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.core.crawl_models import CrawlJob, CrawledPage
from app.providers.html_extractor import HttpxHtmlExtractor
from app.schemas.crawl import CrawlRequest


class CrawlService:
    """Service untuk mengelola pekerjaan perayapan (crawling) situs."""

    def __init__(self):
        self.extractor = HttpxHtmlExtractor()

    async def create_job(self, db: AsyncSession, request: CrawlRequest) -> CrawlJob:
        """Membuat pekerjaan crawling baru di database."""
        job = CrawlJob(
            url=str(request.url).strip(),
            max_depth=request.max_depth,
            path_filter=request.path_filter.strip() if request.path_filter else None,
            limit_pages=request.limit_pages,
            delay_seconds=request.delay_seconds,
            status="PENDING",
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    async def get_job(self, db: AsyncSession, job_id: UUID) -> CrawlJob:
        """Mengambil detail satu pekerjaan crawling."""
        result = await db.execute(select(CrawlJob).where(CrawlJob.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            raise NotFoundException("CrawlJob", str(job_id))
        return job

    async def list_jobs(
        self, db: AsyncSession, page: int = 1, page_size: int = 10
    ) -> dict:
        """Mengambil daftar riwayat pekerjaan crawling dengan paginasi."""
        # Hitung total
        count_result = await db.execute(select(func.count()).select_from(CrawlJob))
        total = count_result.scalar() or 0
        total_pages = max(1, (total + page_size - 1) // page_size)

        # Ambil halaman spesifik
        offset = (page - 1) * page_size
        result = await db.execute(
            select(CrawlJob)
            .order_by(desc(CrawlJob.created_at))
            .offset(offset)
            .limit(page_size)
        )
        jobs = result.scalars().all()

        return {
            "data": jobs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    async def get_job_pages(self, db: AsyncSession, job_id: UUID) -> list[CrawledPage]:
        """Mengambil daftar halaman yang berhasil dirayap dari satu job."""
        # Pastikan job ada
        await self.get_job(db, job_id)
        result = await db.execute(
            select(CrawledPage)
            .where(CrawledPage.crawl_job_id == job_id)
            .order_by(CrawledPage.crawled_at.desc())
        )
        return list(result.scalars().all())

    async def discover_urls_from_sitemap(self, url: str) -> list[str]:
        """
        Mendeteksi dan mengekstrak tautan dari sitemap.xml situs utama jika tersedia.
        """
        parsed = urlparse(url)
        # Bentuk URL sitemap default dari domain
        sitemap_url = f"{parsed.scheme}://{parsed.netloc}/sitemap.xml"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/xml,application/xml,application/xhtml+xml;q=0.9,*/*;q=0.8",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
                # Coba sitemap bawaan dulu
                response = await client.get(sitemap_url)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "xml")
                    urls = [loc.get_text().strip() for loc in soup.find_all("loc")]
                    if urls:
                        return urls
        except Exception:
            pass

        # Jika url masukan itu sendiri berakhiran sitemap.xml, parse langsung
        if url.endswith("sitemap.xml") or "sitemap" in url.lower():
            try:
                async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
                    response = await client.get(url)
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, "xml")
                        urls = [loc.get_text().strip() for loc in soup.find_all("loc")]
                        if urls:
                            return urls
            except Exception:
                pass

        return []


# Singleton instance
crawl_service = CrawlService()
