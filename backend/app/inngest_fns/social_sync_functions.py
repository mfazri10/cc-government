"""
Inngest Functions: Social Media Scraping Workflows.
Mengelola sinkronisasi berkala (Cron) dan pemrosesan per-monitor secara asinkron.
"""

from datetime import datetime, timezone, timedelta
from uuid import UUID
import inngest
from sqlalchemy import select

from app.inngest_fns.client import inngest_client
from app.core.database import async_session_factory
from app.core.social_models import SocialMonitor
from app.services.social_scrape_service import social_scrape_service


@inngest_client.create_function(
    fn_id="scheduled-social-sync",
    trigger=inngest.TriggerCron(cron="*/30 * * * *"),  # Setiap 30 menit
    retries=1,
)
async def scheduled_social_sync(
    ctx: inngest.Context,
    step: inngest.Step,
):
    """
    Cron job untuk mendeteksi monitor media sosial aktif yang sudah jatuh tempo 
    berdasarkan 'scrape_interval_hours' dan memicu sinkronisasinya.
    """
    async def get_due_monitors():
        async with async_session_factory() as db:
            # Cari monitor aktif
            stmt = select(SocialMonitor).where(SocialMonitor.is_active == True)
            result = await db.execute(stmt)
            monitors = result.scalars().all()
            
            due_ids = []
            now = datetime.now(timezone.utc)
            for m in monitors:
                if not m.last_scraped_at:
                    due_ids.append(str(m.id))
                else:
                    # Pastikan last_scraped_at memiliki timezone info
                    last_scraped = m.last_scraped_at
                    if last_scraped.tzinfo is None:
                        last_scraped = last_scraped.replace(tzinfo=timezone.utc)
                        
                    delta = now - last_scraped
                    if delta >= timedelta(hours=m.scrape_interval_hours):
                        due_ids.append(str(m.id))
            return due_ids

    due_monitor_ids = await step.run("get-due-monitors", get_due_monitors)

    if not due_monitor_ids:
        return {"status": "no_monitors_due", "message": "Tidak ada target monitor yang jatuh tempo."}

    # Emit event sinkronisasi untuk masing-masing monitor agar berjalan pararel secara asinkron
    events = [
        inngest.Event(
            name="social/monitor.single.requested",
            data={"monitor_id": m_id}
        )
        for m_id in due_monitor_ids
    ]
    
    await step.send_event("trigger-single-syncs", events)

    return {
        "status": "triggered",
        "monitors_count": len(due_monitor_ids),
        "monitor_ids": due_monitor_ids
    }


@inngest_client.create_function(
    fn_id="sync-single-social-monitor",
    trigger=inngest.TriggerEvent(event="social/monitor.single.requested"),
    retries=2,
)
async def sync_single_social_monitor(
    ctx: inngest.Context,
    step: inngest.Step,
):
    """
    Workflow sinkronisasi satu target monitor:
    1. Jalankan scraper menggunakan service.
    2. Jika berhasil mendapat data baru, picu event analisis sentimen.
    """
    monitor_id_str = ctx.event.data["monitor_id"]
    monitor_id = UUID(monitor_id_str)

    async def run_scraping():
        async with async_session_factory() as db:
            result = await social_scrape_service.run_scraping_for_monitor(db, monitor_id)
            return result

    result = await step.run("execute-scraping", run_scraping)

    # Jika berhasil mengambil item baru, langsung picu pipeline analisis sentimen LLM
    if result["status"] == "SUCCESS" and result["items_scraped"] > 0:
        await step.send_event(
            "trigger-sentiment-analysis",
            inngest.Event(name="sentimen/process.requested", data={})
        )

    return {
        "status": "completed",
        "monitor_id": monitor_id_str,
        "details": result
    }


@inngest_client.create_function(
    fn_id="sync-all-active-social-monitors",
    trigger=inngest.TriggerEvent(event="social/monitors.sync.requested"),
    retries=1,
)
async def sync_all_active_social_monitors(
    ctx: inngest.Context,
    step: inngest.Step,
):
    """
    Pemicu sinkronisasi instan untuk seluruh monitor aktif (misalnya dari tombol UI admin).
    """
    async def get_all_active():
        async with async_session_factory() as db:
            stmt = select(SocialMonitor.id).where(SocialMonitor.is_active == True)
            result = await db.execute(stmt)
            return [str(m_id) for m_id in result.scalars().all()]

    active_ids = await step.run("get-all-active-monitors", get_all_active)

    if not active_ids:
        return {"status": "no_active_monitors"}

    events = [
        inngest.Event(
            name="social/monitor.single.requested",
            data={"monitor_id": m_id}
        )
        for m_id in active_ids
    ]
    
    await step.send_event("trigger-all-syncs", events)

    return {
        "status": "triggered_all",
        "count": len(active_ids)
    }


# ── Daftar semua fungsi untuk registrasi ───────────────────────

social_sync_functions = [
    scheduled_social_sync,
    sync_single_social_monitor,
    sync_all_active_social_monitors,
]
