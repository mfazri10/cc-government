"""
Router: Crawl Engine API.
Sesuai backend-patterns.md Section 1A:
- Menerima request HTTP, validasi payload, panggil Service, return response.
- Emit event ke Inngest agar proses berjalan di background.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

import inngest
from app.core.database import get_db
from app.inngest_fns.client import inngest_client
from app.schemas.crawl import CrawlJobResponse, CrawlRequest, PaginatedCrawlJobs
from app.services.crawl_service import crawl_service

router = APIRouter(prefix="/crawler", tags=["Crawler"])


@router.post(
    "/crawl",
    response_model=CrawlJobResponse,
    status_code=201,
    summary="Submit crawl job baru",
)
async def create_crawl_job(
    request: CrawlRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Membuat pekerjaan crawling baru dan memicu perayapan asinkron di latar belakang
    menggunakan Inngest event-driven engine.
    """
    job = await crawl_service.create_job(db, request)

    # Emit event ke Inngest
    await inngest_client.send(
        inngest.Event(
            name="crawler/crawl.requested",
            data={"job_id": str(job.id)},
        )
    )

    return job


@router.get(
    "/jobs",
    response_model=PaginatedCrawlJobs,
    summary="List semua crawl jobs",
)
async def list_crawl_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Daftar riwayat pekerjaan crawling dengan paginasi."""
    return await crawl_service.list_jobs(db, page, page_size)


@router.get(
    "/jobs/{job_id}",
    response_model=CrawlJobResponse,
    summary="Detail satu crawl job",
)
async def get_crawl_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Mengambil status detail dan statistik pekerjaan crawling."""
    return await crawl_service.get_job(db, job_id)


@router.get(
    "/jobs/{job_id}/pages",
    summary="Daftar halaman yang berhasil dirayap",
)
async def get_crawled_pages(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Mengambil seluruh halaman web beserta isinya yang berhasil dirayap pada job ini."""
    pages = await crawl_service.get_job_pages(db, job_id)
    return [
        {
            "id": page.id,
            "url": page.url,
            "title": page.title,
            "markdown_snippet": page.markdown[:300] + "..." if page.markdown else "",
            "status_code": page.status_code,
            "crawled_at": page.crawled_at,
        }
        for page in pages
    ]
