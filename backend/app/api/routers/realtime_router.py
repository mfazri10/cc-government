"""
Router Layer: Real-time endpoints.
Server-Sent Events (SSE) untuk live dashboard updates.
"""

import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.core.database import get_db
from app.core.models import RawFeedback, AnalyzedFeedback

router = APIRouter(prefix="/realtime", tags=["Realtime"])


async def event_generator(db: AsyncSession):
    """Generate SSE events dengan data analytics terbaru."""
    last_count = 0

    while True:
        try:
            # Hitung total feedbacks
            total = (await db.execute(
                select(func.count(RawFeedback.id))
            )).scalar() or 0

            # Hitung per sentimen
            sentiment_counts = {}
            for sentiment in ["POSITIVE", "NEGATIVE", "NEUTRAL"]:
                count = (await db.execute(
                    select(func.count(AnalyzedFeedback.feedback_id))
                    .where(AnalyzedFeedback.sentiment == sentiment)
                )).scalar() or 0
                sentiment_counts[sentiment] = count

            # Hitung needs attention
            needs_attention = (await db.execute(
                select(func.count(AnalyzedFeedback.feedback_id))
                .where(AnalyzedFeedback.needs_attention == True)
            )).scalar() or 0

            # Hanya kirim update jika ada perubahan
            if total != last_count:
                data = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "total_feedbacks": total,
                    "sentiment": sentiment_counts,
                    "needs_attention": needs_attention,
                    "new_feedbacks": total - last_count,
                }

                yield f"data: {json.dumps(data)}\n\n"
                last_count = total

            await asyncio.sleep(5)  # Update setiap 5 detik

        except asyncio.CancelledError:
            break
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            await asyncio.sleep(5)


@router.get("/stream")
async def stream_events(db: AsyncSession = Depends(get_db)):
    """
    SSE endpoint untuk real-time dashboard updates.
    Client bisa listen dengan:
      const es = new EventSource('/api/v1/realtime/stream');
      es.onmessage = (e) => console.log(JSON.parse(e.data));
    """
    return StreamingResponse(
        event_generator(db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/snapshot")
async def get_snapshot(db: AsyncSession = Depends(get_db)):
    """Ambil snapshot analytics terbaru (one-shot, bukan stream)."""
    total = (await db.execute(
        select(func.count(RawFeedback.id))
    )).scalar() or 0

    sentiment_counts = {}
    for sentiment in ["POSITIVE", "NEGATIVE", "NEUTRAL"]:
        count = (await db.execute(
            select(func.count(AnalyzedFeedback.feedback_id))
            .where(AnalyzedFeedback.sentiment == sentiment)
        )).scalar() or 0
        sentiment_counts[sentiment] = count

    needs_attention = (await db.execute(
        select(func.count(AnalyzedFeedback.feedback_id))
        .where(AnalyzedFeedback.needs_attention == True)
    )).scalar() or 0

    unprocessed = (await db.execute(
        select(func.count(RawFeedback.id))
        .where(RawFeedback.is_processed == False)
    )).scalar() or 0

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_feedbacks": total,
        "sentiment": sentiment_counts,
        "needs_attention": needs_attention,
        "unprocessed": unprocessed,
    }
