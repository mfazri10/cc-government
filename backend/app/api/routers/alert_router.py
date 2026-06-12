"""
Router Layer: Alert endpoints.
Manage dan trigger alert notifications.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.models import AlertLog
from app.services.alert_service import alert_service, AlertChannel

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.post("/process")
async def process_alerts(db: AsyncSession = Depends(get_db)):
    """Proses feedback baru yang needs_attention dan kirim alert."""
    sent = await alert_service.process_new_feedbacks(db)
    return {
        "alerts_sent": sent,
        "message": f"Processed and sent {sent} alerts",
    }


@router.post("/test")
async def test_alert(
    channel: str = Query("telegram", description="Channel: telegram, webhook, email"),
    db: AsyncSession = Depends(get_db),
):
    """Kirim test alert untuk verifikasi konfigurasi."""
    try:
        alert_channel = AlertChannel(channel)
    except ValueError:
        return {"error": f"Invalid channel: {channel}. Use: telegram, webhook, email"}

    success = await alert_service.send_alert(
        db,
        alert_channel,
        "🧪 Test Alert",
        "Ini adalah test alert dari GOVMIND. Jika Anda menerima ini, konfigurasi alert sudah benar!",
    )

    return {
        "channel": channel,
        "success": success,
        "message": "Test alert sent" if success else "Failed to send test alert",
    }


@router.get("/logs")
async def get_alert_logs(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Ambil log alert terbaru."""
    result = await db.execute(
        select(AlertLog)
        .order_by(AlertLog.created_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()

    return {
        "count": len(logs),
        "logs": [
            {
                "id": log.id,
                "channel": log.channel,
                "subject": log.subject,
                "success": log.success,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
    }


@router.get("/config")
async def get_alert_config(db: AsyncSession = Depends(get_db)):
    """Ambil konfigurasi alert saat ini (tanpa secret)."""
    config = await alert_service.get_alert_config(db)

    # Mask sensitive values
    masked = {}
    for key, value in config.items():
        if value:
            if "TOKEN" in key or "KEY" in key:
                masked[key] = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
            else:
                masked[key] = value
        else:
            masked[key] = None

    return {
        "configured_channels": [k.replace("ALERT_", "").lower() for k, v in config.items() if v],
        "config": masked,
    }
