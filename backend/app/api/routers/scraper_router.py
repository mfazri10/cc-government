"""
Router: Scraping Engine API.
Sesuai backend-patterns.md Section 1A:
- Hanya menerima HTTP request, validasi payload, panggil Service, return response.
- Dilarang menulis query database di layer ini.
"""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.scraper import (
    ScrapeRequest,
    ScrapeJobResponse,
    PaginatedScrapeJobs,
    ScrapeStatsResponse,
)
from app.schemas.ingest import IngestFromScrapeRequest, IngestResult
from app.services.scraper_service import scraper_service
from app.services.ingest_service import ingest_service

router = APIRouter(prefix="/scraper", tags=["Scraper"])


@router.post(
    "/scrape",
    response_model=ScrapeJobResponse,
    status_code=201,
    summary="Submit scrape job baru",
)
async def create_scrape_job(
    request: ScrapeRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Menerima URL dan daftar format output yang diinginkan.
    Format yang didukung: markdown, links, json, summary, html, images.
    """
    # Create job
    job = await scraper_service.create_job(db, request)

    # Process langsung (sync) — di Fase 2 ini akan diganti dengan Inngest event emit
    job = await scraper_service.process_scrape(db, job.id)

    return job


@router.get(
    "/jobs",
    response_model=PaginatedScrapeJobs,
    summary="List semua scrape jobs",
)
async def list_scrape_jobs(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Daftar seluruh riwayat scrape jobs dengan paginasi."""
    return await scraper_service.list_jobs(db, page, page_size)


@router.get(
    "/jobs/{job_id}",
    response_model=ScrapeJobResponse,
    summary="Detail satu scrape job",
)
async def get_scrape_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Ambil detail satu scrape job beserta hasilnya."""
    return await scraper_service.get_job(db, job_id)


@router.get(
    "/stats",
    response_model=ScrapeStatsResponse,
    summary="Statistik scraping",
)
async def get_scrape_stats(
    db: AsyncSession = Depends(get_db),
):
    """Statistik keseluruhan: total jobs, success rate, avg time, ingested count."""
    return await scraper_service.get_stats(db)


@router.post(
    "/ingest",
    response_model=IngestResult,
    summary="Ingest hasil scraping ke pipeline sentimen",
)
async def ingest_scrape_results(
    request: IngestFromScrapeRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Ambil hasil scraping yang sudah COMPLETED, pecah konten menjadi
    unit feedback individu, dan simpan ke raw_feedbacks untuk analisis sentimen.
    """
    return await ingest_service.ingest_from_scrape(db, request)
