"""
Router Layer: Analytics endpoints (Dashboard data).
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.analytics import (
    DashboardOverview,
    SentimentSummary,
    TopIssue,
)
from app.services.feedback_service import feedback_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardOverview)
async def get_dashboard_overview(
    days: int = Query(30, ge=1, le=365, description="Rentang hari untuk analisis"),
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint utama untuk halaman Dashboard.
    Mengembalikan ringkasan sentimen, isu teratas, dan statistik umum.
    """
    # Sentiment counts
    counts = await feedback_service.get_sentiment_counts(db, days=days)
    sentiment_summary = SentimentSummary(
        positive=counts.get("POSITIVE", 0),
        negative=counts.get("NEGATIVE", 0),
        neutral=counts.get("NEUTRAL", 0),
        total=sum(counts.values()),
    )

    # Top issues
    raw_issues = await feedback_service.get_top_issues(db, limit=10, days=days)
    top_issues = [TopIssue(topic=i["topic"], count=i["count"]) for i in raw_issues]

    # Counters
    total_feedbacks = sentiment_summary.total
    total_unprocessed = await feedback_service.count_unprocessed(db)
    total_needs_attention = await feedback_service.count_needs_attention(db)

    return DashboardOverview(
        sentiment_summary=sentiment_summary,
        top_issues=top_issues,
        total_feedbacks=total_feedbacks,
        total_unprocessed=total_unprocessed,
        total_needs_attention=total_needs_attention,
    )


@router.get("/sentiment-summary", response_model=SentimentSummary)
async def get_sentiment_summary(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Ringkasan sentimen untuk Pie Chart."""
    counts = await feedback_service.get_sentiment_counts(db, days=days)
    return SentimentSummary(
        positive=counts.get("POSITIVE", 0),
        negative=counts.get("NEGATIVE", 0),
        neutral=counts.get("NEUTRAL", 0),
        total=sum(counts.values()),
    )


@router.get("/top-issues", response_model=list[TopIssue])
async def get_top_issues(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Daftar isu/topik keluhan terbanyak untuk Bar Chart."""
    raw_issues = await feedback_service.get_top_issues(db, limit=limit, days=days)
    return [TopIssue(topic=i["topic"], count=i["count"]) for i in raw_issues]
