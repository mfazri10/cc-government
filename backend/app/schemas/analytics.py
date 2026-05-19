"""
Schemas untuk response analitik (Dashboard / Chart).
"""

from pydantic import BaseModel


class SentimentSummary(BaseModel):
    """Ringkasan sentimen (untuk Pie Chart)."""
    positive: int = 0
    negative: int = 0
    neutral: int = 0
    total: int = 0


class TopIssue(BaseModel):
    """Isu paling sering muncul (untuk Bar Chart)."""
    topic: str
    count: int
    sentiment_breakdown: dict[str, int] | None = None  # {"POSITIVE": 2, "NEGATIVE": 15}


class EmotionTrend(BaseModel):
    """Tren emosi per hari (untuk Line Chart)."""
    date: str
    marah: int = 0
    panik: int = 0
    sedih: int = 0
    apresiasi: int = 0
    harapan: int = 0


class DashboardOverview(BaseModel):
    """Response utama untuk halaman dashboard."""
    sentiment_summary: SentimentSummary
    top_issues: list[TopIssue]
    total_feedbacks: int
    total_unprocessed: int
    total_needs_attention: int
