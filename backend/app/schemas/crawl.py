"""
Pydantic schemas untuk modul Crawl Engine.
Memisahkan representasi API dari model database.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CrawlRequest(BaseModel):
    """Payload request untuk memulai pekerjaan crawling baru."""

    url: str = Field(..., description="URL situs utama atau URL sitemap.xml")
    max_depth: int = Field(2, ge=1, le=5, description="Kedalaman pencarian tautan (1-5)")
    path_filter: str | None = Field(
        None, description="Pattern filter regex/substring untuk membatasi URL yang dirayap"
    )
    limit_pages: int = Field(
        50, ge=1, le=200, description="Maksimum jumlah halaman yang dirayap dalam satu job"
    )
    delay_seconds: float = Field(
        1.0, ge=0.1, le=10.0, description="Jeda waktu antar request (politeness mode)"
    )


class CrawlJobResponse(BaseModel):
    """Representasi respon data pekerjaan crawling."""

    id: UUID
    url: str
    status: str
    max_depth: int
    path_filter: str | None
    limit_pages: int
    delay_seconds: float
    pages_discovered: int
    pages_crawled: int
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class PaginatedCrawlJobs(BaseModel):
    """Format paginasi untuk daftar pekerjaan crawling."""

    data: list[CrawlJobResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
