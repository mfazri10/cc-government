"""
ORM Models untuk modul Scraping Engine.
Menyimpan riwayat scrape jobs beserta hasilnya.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base


class ScrapeJob(Base):
    """
    Riwayat setiap permintaan scraping.
    Setiap kali user men-submit URL untuk di-scrape, satu record dibuat di sini.
    """

    __tablename__ = "scrape_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    url: Mapped[str] = mapped_column(String(2000), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING"
    )  # PENDING, PROCESSING, COMPLETED, FAILED
    formats: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )  # ["markdown", "links", "json", "summary", "html", "images"]

    # ── Results ────────────────────────────────────────────────
    result_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_links: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    result_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    result_metadata: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )  # title, description, favicon, etc.
    result_screenshot_path: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    result_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_images: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # ── Error tracking ─────────────────────────────────────────
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Extraction config ──────────────────────────────────────
    json_schema: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )  # Custom JSON Schema for structured AI extraction

    # ── Ingest tracking (Fase A) ───────────────────────────────
    is_ingested: Mapped[bool] = mapped_column(Boolean, default=False)
    ingest_count: Mapped[int] = mapped_column(Integer, default=0)

    # ── Timestamps ─────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<ScrapeJob(id={self.id}, url='{self.url[:50]}', status='{self.status}')>"

