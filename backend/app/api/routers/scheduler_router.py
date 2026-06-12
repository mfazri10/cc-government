"""
Router Layer: Scheduler endpoints.
Trigger scheduled scraping dan manage cron jobs.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.models import DataSource
from app.inngest_fns.client import inngest_client

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])


@router.post("/trigger-scrape")
async def trigger_scheduled_scrape():
    """Trigger scheduled scraping untuk semua data source aktif."""
    try:
        await inngest_client.send(
            {"name": "scraping/scheduled", "data": {}}
        )
        return {
            "status": "triggered",
            "message": "Scheduled scraping has been triggered",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to trigger: {str(e)}",
        }


@router.get("/data-sources")
async def list_active_sources(db: AsyncSession = Depends(get_db)):
    """List semua data source aktif yang akan di-scrape secara scheduled."""
    result = await db.execute(
        select(DataSource).where(DataSource.status == "active")
    )
    sources = result.scalars().all()

    return {
        "count": len(sources),
        "sources": [
            {
                "id": s.id,
                "name": s.name,
                "url": s.url,
                "status": s.status,
                "last_scraped_at": s.last_scraped_at.isoformat() if s.last_scraped_at else None,
            }
            for s in sources
        ],
    }


@router.put("/data-sources/{source_id}/status")
async def update_source_status(
    source_id: int,
    status: str = Query(..., description="New status: active, inactive, error"),
    db: AsyncSession = Depends(get_db),
):
    """Update status data source (untuk enable/disable scheduled scraping)."""
    result = await db.execute(
        select(DataSource).where(DataSource.id == source_id)
    )
    source = result.scalar_one_or_none()

    if not source:
        return {"error": "Data source not found"}

    source.status = status
    await db.commit()

    return {
        "id": source.id,
        "name": source.name,
        "status": source.status,
        "message": f"Status updated to {status}",
    }
