"""
Service Layer: Ingest Pipeline.
Menghubungkan hasil scraping ke pipeline analisis sentimen.
Sesuai backend-patterns.md Section 1B:
- Logika bisnis: split konten → deduplicate → simpan raw_feedbacks
- Agnostik terhadap HTTP.
"""

import hashlib
import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import RawFeedback, Source
from app.core.scraper_models import ScrapeJob
from app.core.exceptions import NotFoundException, ValidationException
from app.schemas.ingest import IngestFromScrapeRequest, IngestResult


class IngestService:
    """Service untuk meng-ingest hasil scraping ke dalam pipeline sentimen."""

    async def ingest_from_scrape(
        self, db: AsyncSession, request: IngestFromScrapeRequest
    ) -> IngestResult:
        """
        Ambil hasil scraping, pecah menjadi feedback individu,
        lalu simpan ke raw_feedbacks.
        """
        # 1. Validasi job
        result = await db.execute(
            select(ScrapeJob).where(ScrapeJob.id == request.job_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            raise NotFoundException("ScrapeJob", str(request.job_id))

        if job.status != "COMPLETED":
            raise ValidationException(
                f"Job belum selesai (status: {job.status}). Hanya job COMPLETED yang bisa di-ingest."
            )

        # 2. Validasi source
        source_result = await db.execute(
            select(Source).where(Source.id == request.source_id)
        )
        source = source_result.scalar_one_or_none()
        if not source:
            raise NotFoundException("Source", str(request.source_id))

        # 3. Ambil konten
        markdown = job.result_markdown
        if not markdown or len(markdown.strip()) < 20:
            raise ValidationException(
                "Job tidak memiliki konten markdown yang cukup untuk di-ingest."
            )

        # 4. Split konten menjadi feedback individu menggunakan AI
        feedback_units = await self._split_content_with_ai(markdown, job.url)

        # 5. Simpan ke raw_feedbacks dengan deduplikasi
        created = 0
        skipped = 0

        for i, unit in enumerate(feedback_units):
            content = unit.get("content", "").strip()
            if not content or len(content) < 10:
                continue

            # Generate unique ID: hash(url + index)
            original_post_id = hashlib.sha256(
                f"{job.url}::chunk::{i}::{content[:50]}".encode()
            ).hexdigest()[:64]

            # Check duplicate
            existing = await db.execute(
                select(RawFeedback.id).where(
                    RawFeedback.original_post_id == original_post_id
                )
            )
            if existing.scalar_one_or_none():
                skipped += 1
                continue

            feedback = RawFeedback(
                source_id=request.source_id,
                target_entity_id=request.target_entity_id,
                original_post_id=original_post_id,
                author_name=unit.get("author"),
                content=content,
                url=job.url,
                posted_at=None,
                is_processed=False,
            )
            db.add(feedback)
            created += 1

        # 6. Update job tracking
        job.is_ingested = True
        job.ingest_count = created

        await db.commit()

        return IngestResult(
            job_id=job.id,
            feedbacks_created=created,
            feedbacks_skipped=skipped,
            auto_analyze_triggered=request.auto_analyze and created > 0,
        )

    async def _split_content_with_ai(
        self, markdown: str, url: str
    ) -> list[dict]:
        """
        Menggunakan Gemini AI untuk memecah halaman web menjadi
        unit-unit feedback individu (komentar, ulasan, opini).
        """
        try:
            import google.generativeai as genai
            from app.core.config import get_settings

            settings = get_settings()
            genai.configure(api_key=settings.GEMINI_API_KEY)

            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    response_mime_type="application/json",
                ),
            )

            truncated = markdown[:10000] if len(markdown) > 10000 else markdown

            prompt = f"""Kamu adalah sistem pemecah konten web untuk analisis sentimen pemerintahan.

Tugas: Pecah teks berikut menjadi unit-unit feedback individu (komentar, ulasan, opini, keluhan warga).

Aturan:
1. Setiap unit harus berisi SATU opini/komentar/ulasan dari SATU orang.
2. Abaikan navigasi, header, footer, iklan, dan konten non-opini.
3. Jika teks adalah artikel berita, pecah menjadi paragraf-paragraf opini yang relevan.
4. Jika teks adalah halaman review (Google Maps, dll), pecah per-review.
5. Minimal konten per unit: 10 karakter.
6. Jika tidak ada konten opini yang bisa diekstrak, kembalikan array kosong [].

Format output (JSON array):
[
  {{"content": "isi komentar/ulasan lengkap", "author": "nama penulis jika ada atau null"}},
  ...
]

URL sumber: {url}

Teks web:

{truncated}"""

            response = await model.generate_content_async(prompt)
            result = json.loads(response.text)

            if isinstance(result, list):
                return result
            return []

        except Exception:
            # Fallback: split per paragraf
            paragraphs = [p.strip() for p in markdown.split("\n\n") if len(p.strip()) > 20]
            return [{"content": p, "author": None} for p in paragraphs[:50]]


# Singleton instance
ingest_service = IngestService()
