"""
Pydantic schemas untuk modul Scraping Engine.
Memisahkan representasi API (JSON) dari representasi database (ORM).
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


# ── Request Schemas ────────────────────────────────────────────

class ScrapeRequest(BaseModel):
    """Body untuk POST /api/v1/scraper/scrape"""
    url: str
    formats: list[str] = ["markdown", "links"]  # markdown, links, json, summary, html, images
    json_schema: dict | None = None  # Custom JSON Schema for structured AI extraction


# ── Response Schemas ───────────────────────────────────────────

class ScrapeJobResponse(BaseModel):
    """Response model untuk satu scrape job."""
    id: UUID
    url: str
    status: str
    formats: list[str] | None
    result_markdown: str | None = None
    result_links: list[dict] | None = None
    result_json: dict | None = None
    result_metadata: dict | None = None
    result_summary: str | None = None
    result_html: str | None = None
    result_images: list[dict] | None = None
    error_message: str | None = None
    is_ingested: bool = False
    ingest_count: int = 0
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class ScrapeJobListItem(BaseModel):
    """Response ringkas untuk list jobs (tanpa result body besar)."""
    id: UUID
    url: str
    status: str
    formats: list[str] | None
    error_message: str | None = None
    is_ingested: bool = False
    ingest_count: int = 0
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class PaginatedScrapeJobs(BaseModel):
    """Response paginated untuk list scrape jobs."""
    data: list[ScrapeJobListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class ScrapeStatsResponse(BaseModel):
    """Statistik scraping keseluruhan."""
    total_jobs: int
    completed: int
    failed: int
    success_rate: float
    avg_time_seconds: float | None
    total_ingested: int
