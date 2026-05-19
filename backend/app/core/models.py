"""
ORM Models untuk modul Sentimen Warga.
Sesuai backend-patterns.md Section 1C:
- File ini HANYA berisi representasi tabel PostgreSQL (SQLAlchemy ORM).
- Pydantic schemas ada di file terpisah (schemas/).
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class Source(Base):
    """Sumber data (Google Maps, Twitter, Instagram, dll)."""

    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'review', 'social_media', 'news'

    # Relationships
    raw_feedbacks: Mapped[list["RawFeedback"]] = relationship(back_populates="source")

    def __repr__(self) -> str:
        return f"<Source(id={self.id}, name='{self.name}')>"


class TargetEntity(Base):
    """
    OPD / Fasilitas Publik / Tokoh yang dipantau.
    Menyimpan keyword untuk scraping dan kontak PIC untuk alerting.
    """

    __tablename__ = "target_entities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'OPD', 'Fasilitas_Kesehatan', 'Tokoh'
    keywords: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    pic_contact: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    raw_feedbacks: Mapped[list["RawFeedback"]] = relationship(back_populates="target_entity")
    alerts: Mapped[list["AlertLog"]] = relationship(back_populates="target_entity")

    def __repr__(self) -> str:
        return f"<TargetEntity(id={self.id}, name='{self.name}')>"


class RawFeedback(Base):
    """
    Data mentah hasil scraping.
    Belum diproses oleh LLM. Flag `is_processed` digunakan Inngest untuk menandai.
    """

    __tablename__ = "raw_feedbacks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    source_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sources.id"), nullable=False
    )
    target_entity_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("target_entities.id"), nullable=True
    )
    original_post_id: Mapped[str | None] = mapped_column(
        String(500), nullable=True, unique=True, index=True
    )
    author_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scraped_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    source: Mapped["Source"] = relationship(back_populates="raw_feedbacks")
    target_entity: Mapped["TargetEntity | None"] = relationship(back_populates="raw_feedbacks")
    analysis: Mapped["AnalyzedFeedback | None"] = relationship(
        back_populates="raw_feedback", uselist=False
    )

    def __repr__(self) -> str:
        return f"<RawFeedback(id={self.id}, is_processed={self.is_processed})>"


class AnalyzedFeedback(Base):
    """
    Hasil analisis LLM (Gemini).
    Relasi 1-to-1 dengan RawFeedback.
    Dipisahkan agar jika prompt LLM berubah, kita bisa re-analisis tanpa kehilangan data mentah.
    """

    __tablename__ = "analyzed_feedbacks"

    feedback_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("raw_feedbacks.id"),
        primary_key=True,
    )
    sentiment: Mapped[str] = mapped_column(String(20), nullable=False)  # 'POSITIVE', 'NEGATIVE', 'NEUTRAL'
    emotion: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 'Marah', 'Panik', 'Apresiasi', 'Sedih'
    topics: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    needs_attention: Mapped[bool] = mapped_column(Boolean, default=False)
    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    raw_feedback: Mapped["RawFeedback"] = relationship(back_populates="analysis")

    def __repr__(self) -> str:
        return f"<AnalyzedFeedback(feedback_id={self.feedback_id}, sentiment='{self.sentiment}')>"


class AlertLog(Base):
    """
    Log notifikasi EWS (Early Warning System).
    Merekam setiap alert yang dikirim ke PIC OPD via Telegram.
    """

    __tablename__ = "alerts_log"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    target_entity_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("target_entities.id"), nullable=False
    )
    trigger_reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")  # 'SENT', 'FAILED', 'DELIVERED'
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    target_entity: Mapped["TargetEntity"] = relationship(back_populates="alerts")

    def __repr__(self) -> str:
        return f"<AlertLog(id={self.id}, status='{self.status}')>"
