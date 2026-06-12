"""
Router Layer: Export endpoints.
Export feedback data ke CSV dan Excel.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.feedback_service import feedback_service

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/csv")
async def export_feedbacks_csv(
    sentiment: str | None = Query(None, description="Filter: POSITIVE, NEGATIVE, NEUTRAL"),
    entity_id: int | None = Query(None, description="Filter by target entity ID"),
    start_date: datetime | None = Query(None, description="Start date (ISO format)"),
    end_date: datetime | None = Query(None, description="End date (ISO format)"),
    db: AsyncSession = Depends(get_db),
):
    """Export feedback data ke CSV."""
    csv_content = await feedback_service.export_to_csv(
        db,
        sentiment_filter=sentiment,
        entity_id=entity_id,
        start_date=start_date,
        end_date=end_date,
    )

    if not csv_content:
        return StreamingResponse(
            iter(["No data found"]),
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=feedbacks_empty.csv"},
        )

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=feedbacks_export.csv"},
    )


@router.get("/excel")
async def export_feedbacks_excel(
    sentiment: str | None = Query(None, description="Filter: POSITIVE, NEGATIVE, NEUTRAL"),
    entity_id: int | None = Query(None, description="Filter by target entity ID"),
    start_date: datetime | None = Query(None, description="Start date (ISO format)"),
    end_date: datetime | None = Query(None, description="End date (ISO format)"),
    db: AsyncSession = Depends(get_db),
):
    """Export feedback data ke Excel."""
    excel_bytes = await feedback_service.export_to_excel(
        db,
        sentiment_filter=sentiment,
        entity_id=entity_id,
        start_date=start_date,
        end_date=end_date,
    )

    if not excel_bytes:
        return StreamingResponse(
            iter([b"No data found"]),
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=feedbacks_empty.txt"},
        )

    return StreamingResponse(
        iter([excel_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=feedbacks_export.xlsx"},
    )
