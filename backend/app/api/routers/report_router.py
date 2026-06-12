"""
Router Layer: Report endpoints.
Generate dan download PDF reports.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/analytics/pdf")
async def generate_analytics_pdf(
    days: int = Query(30, description="Periode dalam hari"),
    entity_id: int | None = Query(None, description="Filter by entity ID"),
    db: AsyncSession = Depends(get_db),
):
    """Generate dan download laporan analisis dalam format PDF."""
    pdf_bytes = await report_service.generate_analytics_report(
        db, days=days, entity_id=entity_id
    )

    filename = f"govmind_report_{days}days.pdf"

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
