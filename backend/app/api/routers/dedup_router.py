"""
Router Layer: Deduplication endpoints.
Mendeteksi dan menghapus data duplikat.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.dedup_service import dedup_service

router = APIRouter(prefix="/dedup", tags=["Deduplication"])


@router.get("/stats")
async def get_dedup_stats(db: AsyncSession = Depends(get_db)):
    """Statistik deduplikasi data."""
    stats = await dedup_service.get_dedup_stats(db)
    return stats


@router.get("/duplicates")
async def find_duplicates(
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """Cari data duplikat."""
    duplicates = await dedup_service.find_duplicates(db, limit=limit)
    return {
        "count": len(duplicates),
        "duplicates": duplicates,
    }


@router.post("/compute-hashes")
async def compute_hashes(
    batch_size: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """Hitung content hash untuk data yang belum punya hash."""
    updated = await dedup_service.compute_hashes_for_unhashed(db, batch_size=batch_size)
    return {
        "updated": updated,
        "message": f"Computed hashes for {updated} feedbacks",
    }


@router.post("/remove")
async def remove_duplicates(
    keep_latest: bool = Query(True, description="Simpan data terbaru (True) atau terlama (False)"),
    db: AsyncSession = Depends(get_db),
):
    """Hapus data duplikat."""
    deleted = await dedup_service.remove_duplicates(db, keep_latest=keep_latest)
    return {
        "deleted": deleted,
        "message": f"Removed {deleted} duplicate feedbacks",
    }
