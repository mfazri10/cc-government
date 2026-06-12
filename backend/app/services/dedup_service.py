"""
Service Layer: Data Deduplication.
Mendeteksi dan menghapus data duplikat berdasarkan hash konten.
"""

import hashlib
from datetime import datetime, timezone

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import RawFeedback


class DeduplicationService:
    """Handles data deduplication logic."""

    @staticmethod
    def compute_content_hash(content: str) -> str:
        """Compute SHA-256 hash dari konten feedback."""
        normalized = content.strip().lower()
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    async def find_duplicates(
        self, db: AsyncSession, limit: int = 100
    ) -> list[dict]:
        """Cari feedback yang memiliki konten duplikat."""
        # Find duplicate content hashes
        subq = (
            select(
                RawFeedback.content_hash,
                func.count(RawFeedback.id).label("cnt"),
            )
            .where(RawFeedback.content_hash.isnot(None))
            .group_by(RawFeedback.content_hash)
            .having(func.count(RawFeedback.id) > 1)
            .subquery()
        )

        result = await db.execute(
            select(RawFeedback)
            .join(subq, RawFeedback.content_hash == subq.c.content_hash)
            .order_by(RawFeedback.scraped_at.desc())
            .limit(limit)
        )
        rows = result.scalars().all()

        duplicates = []
        for fb in rows:
            duplicates.append({
                "id": str(fb.id),
                "content_preview": fb.content[:100] if fb.content else "",
                "content_hash": fb.content_hash,
                "scraped_at": fb.scraped_at.isoformat() if fb.scraped_at else None,
            })

        return duplicates

    async def compute_hashes_for_unhashed(
        self, db: AsyncSession, batch_size: int = 100
    ) -> int:
        """Hitung content_hash untuk feedback yang belum punya hash."""
        result = await db.execute(
            select(RawFeedback)
            .where(RawFeedback.content_hash.is_(None))
            .limit(batch_size)
        )
        rows = result.scalars().all()

        updated = 0
        for fb in rows:
            if fb.content:
                fb.content_hash = self.compute_content_hash(fb.content)
                updated += 1

        if updated > 0:
            await db.commit()

        return updated

    async def remove_duplicates(
        self, db: AsyncSession, keep_latest: bool = True
    ) -> int:
        """
        Hapus feedback duplikat, simpan yang terbaru (atau terlama).
        Returns jumlah data yang dihapus.
        """
        # Find duplicate hashes
        subq = (
            select(
                RawFeedback.content_hash,
                func.min(RawFeedback.id).label("min_id"),
                func.max(RawFeedback.id).label("max_id"),
                func.count(RawFeedback.id).label("cnt"),
            )
            .where(RawFeedback.content_hash.isnot(None))
            .group_by(RawFeedback.content_hash)
            .having(func.count(RawFeedback.id) > 1)
            .subquery()
        )

        result = await db.execute(select(subq))
        dupes = result.all()

        deleted_count = 0
        for row in dupes:
            # Keep the latest (max_id) or earliest (min_id)
            keep_id = row.max_id if keep_latest else row.min_id

            # Delete all except the one to keep
            stmt = (
                delete(RawFeedback)
                .where(
                    RawFeedback.content_hash == row.content_hash,
                    RawFeedback.id != keep_id,
                )
            )
            result = await db.execute(stmt)
            deleted_count += result.rowcount

        if deleted_count > 0:
            await db.commit()

        return deleted_count

    async def get_dedup_stats(self, db: AsyncSession) -> dict:
        """Statistik deduplikasi."""
        # Total feedbacks
        total = (await db.execute(select(func.count(RawFeedback.id)))).scalar() or 0

        # With hash
        with_hash = (
            await db.execute(
                select(func.count(RawFeedback.id)).where(
                    RawFeedback.content_hash.isnot(None)
                )
            )
        ).scalar() or 0

        # Duplicate groups
        dup_groups = (
            await db.execute(
                select(func.count(subq.c.content_hash)).select_from(
                    select(
                        RawFeedback.content_hash,
                        func.count(RawFeedback.id),
                    )
                    .where(RawFeedback.content_hash.isnot(None))
                    .group_by(RawFeedback.content_hash)
                    .having(func.count(RawFeedback.id) > 1)
                    .subquery()
                    .alias("dupes")
                )
            )
        ).scalar() or 0

        return {
            "total_feedbacks": total,
            "hashed": with_hash,
            "unhashed": total - with_hash,
            "duplicate_groups": dup_groups,
        }


# Singleton instance
dedup_service = DeduplicationService()
