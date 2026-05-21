"""
Inngest Functions: Data Source sync workflow.
Sesuai backend-patterns.md Section 5:
- step.run() untuk checkpoint asinkron.
- cron trigger untuk sinkronisasi otomatis harian.
- event trigger untuk sinkronisasi individual (baik manual maupun otomatis).
"""

import inngest
from sqlalchemy import select

from app.inngest_fns.client import inngest_client
from app.core.database import async_session_factory
from app.core.models import DataSource
from app.services.data_source_service import data_source_service


# ── Fungsi 1: Cron Job - Auto Sync Semua Sumber Data Aktif ─────

@inngest_client.create_function(
    fn_id="scheduled-datasource-sync",
    trigger=inngest.TriggerCron(cron="0 2 * * *"),  # Setiap hari jam 02:00 pagi
    retries=1,
)
async def scheduled_datasource_sync(
    ctx: inngest.Context,
    step: inngest.Step,
):
    """
    Cron job harian untuk mengambil semua DataSource aktif
    dan memicu event sinkronisasi individual secara paralel.
    """
    async def fetch_active_sources():
        async with async_session_factory() as db:
            result = await db.execute(
                select(DataSource).where(DataSource.status == "active")
            )
            return [
                {"id": ds.id, "url": ds.url, "name": ds.name}
                for ds in result.scalars().all()
            ]

    active_sources = await step.run("fetch-active-datasources", fetch_active_sources)

    # Kirim event asinkron untuk masing-masing data source
    events = [
        inngest.Event(
            name="datasource/sync.requested",
            data={"datasource_id": ds["id"]},
        )
        for ds in active_sources
    ]

    if events:
        await step.send_event("trigger-individual-syncs", events)

    return {"triggered_count": len(events)}


# ── Fungsi 2: Worker Sinkronisasi Data Source Individual ───────

@inngest_client.create_function(
    fn_id="execute-datasource-sync",
    trigger=inngest.TriggerEvent(event="datasource/sync.requested"),
    retries=3,
)
async def execute_datasource_sync(
    ctx: inngest.Context,
    step: inngest.Step,
):
    """
    Workflow sinkronisasi data source:
    1. Jalankan perayapan, pembersihan, dan ingesti data source.
    2. Cek status hasil sinkronisasi.
    3. Jika ulasan baru masuk, kirim event analisis sentimen.
    """
    ds_id = ctx.event.data["datasource_id"]

    async def run_sync():
        async with async_session_factory() as db:
            return await data_source_service.execute_sync_flow(db, ds_id)

    result = await step.run("execute-sync-flow", run_sync)

    if result.get("status") == "success" and result.get("feedbacks_created", 0) > 0:
        # Picu analisis sentimen secara asinkron untuk raw feedbacks yang baru saja di-ingest
        await step.send_event(
            "trigger-sentiment-analysis",
            inngest.Event(name="sentimen/process.requested", data={}),
        )

    return result


# ── Daftar semua fungsi untuk registrasi ───────────────────────

all_functions = [
    scheduled_datasource_sync,
    execute_datasource_sync,
]
