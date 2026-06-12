"""
Service Layer: Alert & Notification system.
Mengirim notifikasi email/SMS untuk feedback yang needs_attention.
"""

import logging
from datetime import datetime, timezone
from enum import Enum

import httpx
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import AnalyzedFeedback, RawFeedback, AlertLog, SystemSetting
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class AlertChannel(str, Enum):
    EMAIL = "email"
    TELEGRAM = "telegram"
    WEBHOOK = "webhook"


class AlertService:
    """Handles alert notifications for critical feedbacks."""

    async def get_alert_config(self, db: AsyncSession) -> dict:
        """Ambil konfigurasi alert dari database."""
        config = {}

        keys = ["ALERT_EMAIL", "ALERT_TELEGRAM_BOT_TOKEN", "ALERT_TELEGRAM_CHAT_ID", "ALERT_WEBHOOK_URL"]
        for key in keys:
            result = await db.execute(
                select(SystemSetting).where(SystemSetting.key == key)
            )
            setting = result.scalar_one_or_none()
            if setting and setting.value.strip():
                config[key] = setting.value.strip()

        return config

    async def send_telegram_alert(
        self, bot_token: str, chat_id: str, message: str
    ) -> bool:
        """Kirim alert via Telegram."""
        try:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "HTML",
                })
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Telegram alert failed: {e}")
            return False

    async def send_webhook_alert(self, webhook_url: str, data: dict) -> bool:
        """Kirim alert via webhook."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(webhook_url, json=data, timeout=10)
                return response.status_code in [200, 201, 202]
        except Exception as e:
            logger.error(f"Webhook alert failed: {e}")
            return False

    async def send_alert(
        self,
        db: AsyncSession,
        channel: AlertChannel,
        subject: str,
        message: str,
        feedback_id: str | None = None,
    ) -> bool:
        """Kirim alert melalui channel yang dipilih."""
        config = await self.get_alert_config(db)
        success = False

        if channel == AlertChannel.TELEGRAM:
            bot_token = config.get("ALERT_TELEGRAM_BOT_TOKEN")
            chat_id = config.get("ALERT_TELEGRAM_CHAT_ID")
            if bot_token and chat_id:
                success = await self.send_telegram_alert(bot_token, chat_id, message)

        elif channel == AlertChannel.WEBHOOK:
            webhook_url = config.get("ALERT_WEBHOOK_URL")
            if webhook_url:
                success = await self.send_webhook_alert(webhook_url, {
                    "subject": subject,
                    "message": message,
                    "feedback_id": feedback_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

        elif channel == AlertChannel.EMAIL:
            # Email implementation placeholder
            # In production, integrate with SMTP or email service
            logger.info(f"Email alert: {subject} - {message}")
            success = True

        # Log the alert
        alert_log = AlertLog(
            channel=channel.value,
            subject=subject,
            message=message,
            feedback_id=feedback_id,
            success=success,
        )
        db.add(alert_log)
        await db.commit()

        return success

    async def process_new_feedbacks(self, db: AsyncSession) -> int:
        """
        Proses feedback baru yang needs_attention.
        Kirim alert untuk setiap feedback yang perlu perhatian.
        """
        # Find unprocessed feedbacks that need attention
        result = await db.execute(
            select(AnalyzedFeedback)
            .join(RawFeedback)
            .where(
                and_(
                    AnalyzedFeedback.needs_attention == True,
                    RawFeedback.is_processed == True,
                )
            )
            .order_by(RawFeedback.scraped_at.desc())
            .limit(10)
        )
        feedbacks = result.scalars().all()

        if not feedbacks:
            return 0

        config = await self.get_alert_config(db)
        alerts_sent = 0

        for feedback in feedbacks:
            # Get the raw feedback
            raw_result = await db.execute(
                select(RawFeedback).where(RawFeedback.id == feedback.feedback_id)
            )
            raw = raw_result.scalar_one_or_none()

            if not raw:
                continue

            # Check if alert already sent
            existing_alert = await db.execute(
                select(AlertLog).where(
                    and_(
                        AlertLog.feedback_id == str(feedback.feedback_id),
                        AlertLog.success == True,
                    )
                )
            )
            if existing_alert.scalar_one_or_none():
                continue

            # Prepare alert message
            subject = f"⚠️ Feedback Butuh Perhatian - {feedback.sentiment}"
            content_preview = raw.content[:200] if raw.content else "N/A"
            message = (
                f"<b>⚠️ Feedback Butuh Perhatian</b>\n\n"
                f"<b>Sentimen:</b> {feedback.sentiment}\n"
                f"<b>Emosi:</b> {feedback.emotion}\n"
                f"<b>Topik:</b> {', '.join(feedback.topics) if feedback.topics else 'N/A'}\n"
                f"<b>Konten:</b> {content_preview}\n\n"
                f"<i>Waktu: {raw.scraped_at.strftime('%Y-%m-%d %H:%M') if raw.scraped_at else 'N/A'}</i>"
            )

            # Send via Telegram if configured
            if config.get("ALERT_TELEGRAM_BOT_TOKEN") and config.get("ALERT_TELEGRAM_CHAT_ID"):
                success = await self.send_alert(
                    db, AlertChannel.TELEGRAM, subject, message, str(feedback.feedback_id)
                )
                if success:
                    alerts_sent += 1

            # Send via webhook if configured
            if config.get("ALERT_WEBHOOK_URL"):
                await self.send_alert(
                    db, AlertChannel.WEBHOOK, subject, message, str(feedback.feedback_id)
                )

        return alerts_sent


# Singleton instance
alert_service = AlertService()
