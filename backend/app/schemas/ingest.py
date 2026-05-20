"""
Pydantic schemas untuk modul Ingest Pipeline.
Menghubungkan hasil scraping ke raw_feedbacks untuk analisis sentimen.
"""

from uuid import UUID

from pydantic import BaseModel


class IngestFromScrapeRequest(BaseModel):
    """Body untuk POST /api/v1/scraper/ingest"""
    job_id: UUID
    source_id: int
    target_entity_id: int | None = None
    auto_analyze: bool = True  # Otomatis trigger sentimen analysis via Inngest


class IngestResult(BaseModel):
    """Response setelah proses ingest."""
    job_id: UUID
    feedbacks_created: int
    feedbacks_skipped: int  # duplikat yang di-skip
    auto_analyze_triggered: bool
