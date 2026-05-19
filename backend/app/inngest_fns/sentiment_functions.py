"""
Inngest Functions: Analisis sentimen pipeline.
Sesuai backend-patterns.md Section 5:
- step.run() untuk checkpoint (jika retry, lompat ke step yang gagal).
- Idempotent: proses hanya feedback yang belum diproses (is_processed=False).
- Router hanya emit event (202 Accepted), Inngest yang mengerjakan.
"""

import inngest

from app.inngest_fns.client import inngest_client
from app.core.database import async_session_factory
from app.core.models import RawFeedback, AnalyzedFeedback
from app.providers.gemini_analyzer import GeminiSentimentAnalyzer
from app.services.feedback_service import feedback_service
from app.schemas.feedback import AnalyzedFeedbackCreate

from sqlalchemy import select


# ── Fungsi 1: Process Batch Feedbacks ──────────────────────────

@inngest_client.create_function(
    fn_id="process-unprocessed-feedbacks",
    trigger=inngest.TriggerEvent(event="sentimen/process.requested"),
    retries=3,
)
async def process_unprocessed_feedbacks(
    ctx: inngest.Context,
    step: inngest.Step,
):
    """
    Workflow utama:
    1. Ambil batch feedback yang belum diproses
    2. Analisis masing-masing dengan Gemini
    3. Simpan hasil ke analyzed_feedbacks
    4. Tandai sebagai processed
    """

    # Step 1: Ambil data yang belum diproses
    async def fetch_unprocessed():
        async with async_session_factory() as db:
            feedbacks = await feedback_service.get_unprocessed_feedbacks(db, limit=10)
            return [
                {"id": str(fb.id), "content": fb.content}
                for fb in feedbacks
            ]

    batch = await step.run("fetch-unprocessed", fetch_unprocessed)

    if not batch:
        return {"status": "no_data", "message": "Tidak ada feedback untuk diproses."}

    # Step 2: Analisis dengan Gemini
    analyzer = GeminiSentimentAnalyzer()

    async def analyze_batch():
        texts = [item["content"] for item in batch]
        results = await analyzer.batch_analyze(texts)
        # Gabungkan ID dengan hasil analisis
        return [
            {**result, "feedback_id": batch[i]["id"]}
            for i, result in enumerate(results)
        ]

    analyzed = await step.run("analyze-with-gemini", analyze_batch)

    # Step 3: Simpan hasil dan tandai processed
    async def save_results():
        async with async_session_factory() as db:
            saved_count = 0
            for item in analyzed:
                from uuid import UUID
                feedback_id = UUID(item["feedback_id"])

                # Simpan analisis (idempotent: skip jika sudah ada)
                existing = await db.execute(
                    select(AnalyzedFeedback).where(
                        AnalyzedFeedback.feedback_id == feedback_id
                    )
                )
                if existing.scalar_one_or_none():
                    continue

                analysis_data = AnalyzedFeedbackCreate(
                    feedback_id=feedback_id,
                    sentiment=item["sentiment"],
                    emotion=item.get("emotion"),
                    topics=item.get("topics", []),
                    summary=item.get("summary"),
                    needs_attention=item.get("needs_attention", False),
                )
                await feedback_service.save_analysis(db, analysis_data)
                await feedback_service.mark_as_processed(db, feedback_id)
                saved_count += 1

            return saved_count

    saved = await step.run("save-analysis-results", save_results)

    return {
        "status": "completed",
        "batch_size": len(batch),
        "saved": saved,
    }


# ── Fungsi 2: Cron Job — Proses Otomatis Tiap Jam ─────────────

@inngest_client.create_function(
    fn_id="scheduled-feedback-processing",
    trigger=inngest.TriggerCron(cron="0 * * * *"),  # Setiap jam
    retries=2,
)
async def scheduled_processing(
    ctx: inngest.Context,
    step: inngest.Step,
):
    """
    Cron job yang berjalan tiap jam.
    Emit event untuk memproses feedback yang belum dianalisis.
    """
    await step.send_event(
        "trigger-processing",
        inngest.Event(name="sentimen/process.requested", data={}),
    )
    return {"status": "triggered"}


# ── Daftar semua fungsi untuk registrasi ───────────────────────

all_functions = [
    process_unprocessed_feedbacks,
    scheduled_processing,
]
