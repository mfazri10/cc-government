"""
ORM Models untuk modul Crawl Engine.
Menyimpan riwayat crawl jobs beserta halaman yang berhasil dirayap.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, ForeignKey, func, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base


class CrawlJob(Base):
    """
    Riwayat setiap perayapan (crawling) situs web.
    Menyimpan parameter crawler, status, dan statistik progres.
    """

    __tablename__ = "crawl_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    url: Mapped[str] = mapped_column(String(2000), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING"
    )  # PENDING, PROCESSING, COMPLETED, FAILED
    max_depth: Mapped[int] = mapped_column(Integer, default=2)
    path_filter: Mapped[str | None] = mapped_column(String(500), nullable=True)
    limit_pages: Mapped[int] = mapped_column(Integer, default=50)
    delay_seconds: Mapped[float] = mapped_column(Float, default=1.0)

    # ── Progress tracking ──────────────────────────────────────
    pages_discovered: Mapped[int] = mapped_column(Integer, default=0)
    pages_crawled: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Timestamps ─────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    pages: Mapped[list["CrawledPage"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<CrawlJob(id={self.id}, url='{self.url[:50]}', status='{self.status}', crawled={self.pages_crawled}/{self.pages_discovered})>"


class CrawledPage(Base):
    """
    Halaman individu yang berhasil dirayap dalam satu CrawlJob.
    Menyimpan isi konten utama halaman yang sudah dibersihkan ke Markdown.
    """

    __tablename__ = "crawled_pages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    crawl_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("crawl_jobs.id"), nullable=False
    )
    url: Mapped[str] = mapped_column(String(2000), nullable=False)
    title: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    crawled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    job: Mapped["CrawlJob"] = relationship(back_populates="pages")

    def __repr__(self) -> str:
        return f"<CrawledPage(id={self.id}, url='{self.url[:50]}')>"
