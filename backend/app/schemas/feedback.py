"""
Pydantic Schemas untuk modul Feedback.
Sesuai backend-patterns.md Section 1C & Section 7:
- Schemas terpisah dari ORM models.
- Type hinting disiplin di seluruh file.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Source Schemas ──────────────────────────────────────────────

class SourceBase(BaseModel):
    name: str = Field(..., max_length=100, examples=["Google Maps"])
    type: str = Field(..., max_length=50, examples=["review"])


class SourceCreate(SourceBase):
    pass


class SourceResponse(SourceBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ── Target Entity Schemas ──────────────────────────────────────

class TargetEntityBase(BaseModel):
    name: str = Field(..., max_length=200, examples=["RSUD Cibabat"])
    entity_type: str = Field(..., max_length=50, examples=["Fasilitas_Kesehatan"])
    keywords: list[str] | None = Field(None, examples=[["rsud cibabat", "rs cibabat"]])
    pic_contact: str | None = Field(None, max_length=200, examples=["+628123456789"])


class TargetEntityCreate(TargetEntityBase):
    pass


class TargetEntityUpdate(BaseModel):
    name: str | None = None
    entity_type: str | None = None
    keywords: list[str] | None = None
    pic_contact: str | None = None


class TargetEntityResponse(TargetEntityBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Raw Feedback Schemas ───────────────────────────────────────

class RawFeedbackBase(BaseModel):
    source_id: int
    target_entity_id: int | None = None
    original_post_id: str | None = None
    author_name: str | None = None
    content: str = Field(..., min_length=1)
    url: str | None = None
    posted_at: datetime | None = None


class RawFeedbackCreate(RawFeedbackBase):
    pass


class RawFeedbackBatchCreate(BaseModel):
    """Untuk bulk insert dari hasil scraping."""
    feedbacks: list[RawFeedbackCreate] = Field(..., min_length=1)


class RawFeedbackResponse(RawFeedbackBase):
    id: UUID
    scraped_at: datetime
    is_processed: bool

    model_config = ConfigDict(from_attributes=True)


# ── Analyzed Feedback Schemas ──────────────────────────────────

class AnalyzedFeedbackBase(BaseModel):
    sentiment: str = Field(..., examples=["POSITIVE"])
    emotion: str | None = Field(None, examples=["Marah"])
    topics: list[str] | None = Field(None, examples=[["Antrian", "AC Rusak"]])
    summary: str | None = None
    needs_attention: bool = False


class AnalyzedFeedbackCreate(AnalyzedFeedbackBase):
    feedback_id: UUID


class AnalyzedFeedbackResponse(AnalyzedFeedbackBase):
    feedback_id: UUID
    analyzed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Feedback with Analysis (Joined) ───────────────────────────

class FeedbackWithAnalysis(BaseModel):
    """Gabungan raw_feedback + analyzed_feedback untuk tampil di dashboard."""
    id: UUID
    content: str
    author_name: str | None = None
    url: str | None = None
    posted_at: datetime | None = None
    scraped_at: datetime
    source_name: str | None = None
    target_entity_name: str | None = None
    sentiment: str | None = None
    emotion: str | None = None
    topics: list[str] | None = None
    needs_attention: bool = False


# ── Alert Log Schemas ──────────────────────────────────────────

class AlertLogResponse(BaseModel):
    id: UUID
    target_entity_id: int
    trigger_reason: str
    status: str
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Pagination ─────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    """Generic pagination wrapper."""
    data: list
    total: int
    page: int
    page_size: int
    total_pages: int
