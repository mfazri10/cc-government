"""
Router Layer: Map endpoints.
Data untuk interactive map view.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.core.database import get_db
from app.core.models import TargetEntity, RawFeedback, AnalyzedFeedback

router = APIRouter(prefix="/map", tags=["Map"])


@router.get("/locations")
async def get_map_locations(
    entity_type: str | None = Query(None, description="Filter: opd, facility, figure"),
    db: AsyncSession = Depends(get_db),
):
    """Ambil data lokasi untuk ditampilkan di peta."""
    query = select(TargetEntity)

    if entity_type:
        query = query.where(TargetEntity.type == entity_type)

    result = await db.execute(query)
    entities = result.scalars().all()

    locations = []
    for entity in entities:
        # Count feedbacks per entity
        feedback_count = (await db.execute(
            select(func.count(RawFeedback.id))
            .where(RawFeedback.target_entity_id == entity.id)
        )).scalar() or 0

        # Get dominant sentiment
        sentiment_result = await db.execute(
            select(
                AnalyzedFeedback.sentiment,
                func.count(AnalyzedFeedback.feedback_id).label("cnt"),
            )
            .join(RawFeedback)
            .where(RawFeedback.target_entity_id == entity.id)
            .group_by(AnalyzedFeedback.sentiment)
            .order_by(func.count(AnalyzedFeedback.feedback_id).desc())
            .limit(1)
        )
        dominant = sentiment_result.first()
        dominant_sentiment = dominant[0] if dominant else "NEUTRAL"

        # Use entity coordinates if available, otherwise generate placeholder
        lat = getattr(entity, "latitude", None) or (-6.1 + (hash(entity.name) % 100) / 1000)
        lng = getattr(entity, "longitude", None) or (106.7 + (hash(entity.name) % 100) / 1000)

        locations.append({
            "id": entity.id,
            "name": entity.name,
            "lat": float(lat),
            "lng": float(lng),
            "sentiment": dominant_sentiment,
            "feedbackCount": feedback_count,
            "type": entity.type or "opd",
        })

    return {
        "count": len(locations),
        "locations": locations,
    }


@router.get("/heatmap-data")
async def get_heatmap_data(db: AsyncSession = Depends(get_db)):
    """Ambil data untuk heatmap visualisasi."""
    result = await db.execute(
        select(TargetEntity)
    )
    entities = result.scalars().all()

    heatmap_points = []
    for entity in entities:
        # Count negative feedbacks (hotspot)
        neg_count = (await db.execute(
            select(func.count(AnalyzedFeedback.feedback_id))
            .join(RawFeedback)
            .where(
                RawFeedback.target_entity_id == entity.id,
                AnalyzedFeedback.sentiment == "NEGATIVE",
            )
        )).scalar() or 0

        lat = getattr(entity, "latitude", None) or (-6.1 + (hash(entity.name) % 100) / 1000)
        lng = getattr(entity, "longitude", None) or (106.7 + (hash(entity.name) % 100) / 1000)

        if neg_count > 0:
            heatmap_points.append({
                "lat": float(lat),
                "lng": float(lng),
                "intensity": min(neg_count / 10.0, 1.0),  # Normalize 0-1
                "count": neg_count,
            })

    return {
        "points": heatmap_points,
    }
