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


# ── Daftar semua fungsi untuk registrasi ───────────────────────

scraping_functions = [
    process_scrape_job,
]
