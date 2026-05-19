"""
Router Layer: Feedback endpoints.
Sesuai backend-patterns.md Section 1A:
- HANYA menerima request, validasi, panggil service, return response.
- Dilarang menulis query database atau logika bisnis di sini.
"""

import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.feedback import (
    FeedbackWithAnalysis,
    PaginatedResponse,
    RawFeedbackBatchCreate,
    RawFeedbackCreate,
    RawFeedbackResponse,
)
from app.services.feedback_service import feedback_service

router = APIRouter(prefix="/feedbacks", tags=["Feedbacks"])


@router.post("/", response_model=RawFeedbackResponse, status_code=201)
async def create_feedback(
    req: RawFeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    """Simpan satu feedback mentah (biasanya dari scraper)."""
    feedback = await feedback_service.create_raw_feedback(db, req)
    return feedback


@router.post("/batch", status_code=201)
async def batch_create_feedbacks(
    req: RawFeedbackBatchCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Bulk insert feedbacks dari hasil scraping.
    Mengembalikan jumlah data yang berhasil disimpan (skip duplicates).
    """
    inserted = await feedback_service.bulk_create_raw_feedbacks(db, req.feedbacks)
    return {"inserted": inserted, "total_submitted": len(req.feedbacks)}


@router.get("/", response_model=PaginatedResponse)
async def list_feedbacks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sentiment: str | None = Query(None, description="Filter: POSITIVE, NEGATIVE, NEUTRAL"),
    entity_id: int | None = Query(None, description="Filter by target entity ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Daftar feedback beserta hasil analisis (untuk tabel di dashboard).
    Mendukung pagination dan filter.
    """
    items, total = await feedback_service.get_feedbacks_with_analysis(
        db, page=page, page_size=page_size,
        sentiment_filter=sentiment, entity_id=entity_id,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
