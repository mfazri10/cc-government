"""
Service Layer: Feedback operations.
Sesuai backend-patterns.md Section 1B:
- Semua logika bisnis ada di sini.
- Agnostik terhadap HTTP (tidak tahu Request, Header, HTTPException).
- Me-return data model murni atau raise custom exception.
"""

import math
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.exceptions import (
    DuplicateEntryException,
    FeedbackNotFoundException,
)
from app.core.models import AnalyzedFeedback, RawFeedback, Source, TargetEntity
from app.schemas.feedback import (
    AnalyzedFeedbackCreate,
    FeedbackWithAnalysis,
    RawFeedbackCreate,
)


class FeedbackService:
    """
    Handles all business logic for feedback CRUD and querying.
    """

    # ── Raw Feedbacks ──────────────────────────────────────────

    async def create_raw_feedback(
        self, db: AsyncSession, data: RawFeedbackCreate
    ) -> RawFeedback:
        """Simpan satu feedback mentah dari scraper."""
        # Check duplicate by original_post_id
        if data.original_post_id:
            existing = await db.execute(
                select(RawFeedback).where(
                    RawFeedback.original_post_id == data.original_post_id
                )
            )
            if existing.scalar_one_or_none():
                raise DuplicateEntryException(
                    f"Feedback dengan original_post_id '{data.original_post_id}' sudah ada."
                )

        feedback = RawFeedback(**data.model_dump())
        db.add(feedback)
        await db.commit()
        await db.refresh(feedback)
        return feedback

    async def bulk_create_raw_feedbacks(
        self, db: AsyncSession, feedbacks: list[RawFeedbackCreate]
    ) -> int:
        """Bulk insert feedbacks, skip duplicates. Returns count of inserted."""
        inserted_count = 0
        for data in feedbacks:
            # Skip duplicate
            if data.original_post_id:
                existing = await db.execute(
                    select(RawFeedback.id).where(
                        RawFeedback.original_post_id == data.original_post_id
                    )
                )
                if existing.scalar_one_or_none():
                    continue

            feedback = RawFeedback(**data.model_dump())
            db.add(feedback)
            inserted_count += 1

        await db.commit()
        return inserted_count

    async def get_unprocessed_feedbacks(
        self, db: AsyncSession, limit: int = 10
    ) -> list[RawFeedback]:
        """Ambil feedback yang belum diproses (untuk Inngest worker)."""
        result = await db.execute(
            select(RawFeedback)
            .where(RawFeedback.is_processed == False)  # noqa: E712
            .order_by(RawFeedback.scraped_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_as_processed(
        self, db: AsyncSession, feedback_id: UUID
    ) -> None:
        """Tandai feedback sebagai sudah diproses."""
        result = await db.execute(
            select(RawFeedback).where(RawFeedback.id == feedback_id)
        )
        feedback = result.scalar_one_or_none()
        if not feedback:
            raise FeedbackNotFoundException(str(feedback_id))

        feedback.is_processed = True
        await db.commit()

    # ── Analyzed Feedbacks ─────────────────────────────────────

    async def save_analysis(
        self, db: AsyncSession, data: AnalyzedFeedbackCreate
    ) -> AnalyzedFeedback:
        """Simpan hasil analisis LLM."""
        analysis = AnalyzedFeedback(**data.model_dump())
        db.add(analysis)
        await db.commit()
        await db.refresh(analysis)
        return analysis

    # ── Queries untuk Dashboard ────────────────────────────────

    async def get_feedbacks_with_analysis(
        self,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        sentiment_filter: str | None = None,
        entity_id: int | None = None,
    ) -> tuple[list[FeedbackWithAnalysis], int]:
        """
        Query gabungan raw_feedback + analyzed_feedback.
        Returns (data, total_count).
        """
        base_query = (
            select(RawFeedback)
            .outerjoin(AnalyzedFeedback)
            .outerjoin(Source)
            .outerjoin(TargetEntity)
            .options(
                joinedload(RawFeedback.analysis),
                joinedload(RawFeedback.source),
                joinedload(RawFeedback.target_entity),
            )
        )

        # Filters
        conditions = []
        if sentiment_filter:
            conditions.append(AnalyzedFeedback.sentiment == sentiment_filter.upper())
        if entity_id:
            conditions.append(RawFeedback.target_entity_id == entity_id)

        if conditions:
            base_query = base_query.where(and_(*conditions))

        # Count
        count_query = select(func.count()).select_from(base_query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        # Paginate
        offset = (page - 1) * page_size
        result = await db.execute(
            base_query.order_by(RawFeedback.scraped_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        rows = result.unique().scalars().all()

        # Map to response schema
        items = []
        for fb in rows:
            items.append(
                FeedbackWithAnalysis(
                    id=fb.id,
                    content=fb.content,
                    author_name=fb.author_name,
                    url=fb.url,
                    posted_at=fb.posted_at,
                    scraped_at=fb.scraped_at,
                    source_name=fb.source.name if fb.source else None,
                    target_entity_name=fb.target_entity.name if fb.target_entity else None,
                    sentiment=fb.analysis.sentiment if fb.analysis else None,
                    emotion=fb.analysis.emotion if fb.analysis else None,
                    topics=fb.analysis.topics if fb.analysis else None,
                    needs_attention=fb.analysis.needs_attention if fb.analysis else False,
                )
            )

        return items, total

    async def get_sentiment_counts(
        self, db: AsyncSession, days: int = 30
    ) -> dict[str, int]:
        """Hitung total per sentimen dalam N hari terakhir."""
        since = datetime.now(timezone.utc) - timedelta(days=days)

        result = await db.execute(
            select(
                AnalyzedFeedback.sentiment,
                func.count(AnalyzedFeedback.feedback_id),
            )
            .join(RawFeedback)
            .where(RawFeedback.scraped_at >= since)
            .group_by(AnalyzedFeedback.sentiment)
        )

        counts: dict[str, int] = {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0}
        for sentiment, count in result.all():
            counts[sentiment] = count

        return counts

    async def get_top_issues(
        self, db: AsyncSession, limit: int = 10, days: int = 30
    ) -> list[dict]:
        """Ambil topik keluhan terbanyak dari N hari terakhir."""
        since = datetime.now(timezone.utc) - timedelta(days=days)

        result = await db.execute(
            select(
                func.unnest(AnalyzedFeedback.topics).label("topic"),
                func.count().label("cnt"),
            )
            .join(RawFeedback)
            .where(RawFeedback.scraped_at >= since)
            .group_by("topic")
            .order_by(func.count().desc())
            .limit(limit)
        )

        return [{"topic": row.topic, "count": row.cnt} for row in result.all()]

    async def count_needs_attention(self, db: AsyncSession) -> int:
        """Hitung feedback yang butuh perhatian segera."""
        result = await db.execute(
            select(func.count(AnalyzedFeedback.feedback_id)).where(
                AnalyzedFeedback.needs_attention == True  # noqa: E712
            )
        )
        return result.scalar() or 0

    async def count_unprocessed(self, db: AsyncSession) -> int:
        """Hitung feedback yang belum diproses."""
        result = await db.execute(
            select(func.count(RawFeedback.id)).where(
                RawFeedback.is_processed == False  # noqa: E712
            )
        )
        return result.scalar() or 0


# Singleton instance
feedback_service = FeedbackService()
