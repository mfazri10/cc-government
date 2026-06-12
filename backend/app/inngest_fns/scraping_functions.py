"""
Inngest Functions: Scraping workflow.
Sesuai backend-patterns.md Section 5:
- step.run() untuk checkpoint (jika retry, lompat ke step yang gagal).
- Idempotent: skip jika job sudah COMPLETED.
- Router hanya emit event (202 Accepted), Inngest yang mengerjakan.

NOTE: Fase 1 menggunakan synchronous processing di router.
      Fase 2 akan mengaktifkan fungsi ini untuk async processing.
"""

import inngest

from app.inngest_fns.client import inngest_client
from app.core.database import async_session_factory
from app.services.scraper_service import scraper_service

from uuid import UUID


@inngest_client.create_function(
    fn_id="process-scrape-job",
    trigger=inngest.TriggerEvent(event="scraping/url.requested"),
    retries=2,
)
async def process_scrape_job(
    ctx: inngest.Context,
    step: inngest.Step,
):
    """
    Workflow scraping:
    1. Ambil job dari database
    2. Fetch HTML target
    3. Ekstrak format yang diminta
    4. Simpan hasil
    """
    job_id = UUID(ctx.event.data["job_id"])

    async def run_scrape():
        async with async_session_factory() as db:
            job = await scraper_service.process_scrape(db, job_id)
            return {
                "job_id": str(job.id),
                "status": job.status,
                "url": job.url,
            }

    result = await step.run("execute-scrape", run_scrape)

    return {
        "status": "completed",
        "job": result,
    }


# ── Scheduled Scraping (Cron) ─────────────────────────────────

@inngest_client.create_function(
    fn_id="scheduled-scrape",
    trigger=inngest.TriggerEvent(event="scraping/scheduled"),
    retries=1,
)
async def scheduled_scrape(
    ctx: inngest.Context,
    step: inngest.Step,
):
    """
    Scheduled scraping: jalankan scraping untuk semua data source aktif.
    Dipicu oleh cron atau manual trigger.
    """
    async def run_scheduled():
        async with async_session_factory() as db:
            from sqlalchemy import select
            from app.core.models import DataSource
            
            # Ambil semua data source aktif
            result = await db.execute(
                select(DataSource).where(DataSource.status == "active")
            )
            sources = result.scalars().all()
            
            processed = 0
            errors = []
            
            for source in sources:
                try:
                    from app.schemas.scraper import ScrapeRequest
                    request = ScrapeRequest(
                        url=source.url,
                        selectors={"content": "body"},
                        output_format="text",
                    )
                    await scraper_service.create_and_process_scrape(db, request)
                    processed += 1
                except Exception as e:
                    errors.append({"source_id": source.id, "error": str(e)})
            
            return {
                "total_sources": len(sources),
                "processed": processed,
                "errors": len(errors),
                "error_details": errors[:5],  # Limit error details
            }

    result = await step.run("execute-scheduled-scrape", run_scheduled)
    return result


# ── Daftar semua fungsi untuk registrasi ───────────────────────

scraping_functions = [
    process_scrape_job,
    scheduled_scrape,
]
