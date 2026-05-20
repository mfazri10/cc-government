"""
Service Layer: Scraper Engine.
Sesuai backend-patterns.md Section 1B:
- Semua logika bisnis scraping berada di sini.
- Agnostik terhadap HTTP (tidak tahu soal Request/Response).
- Service me-return data model murni atau custom exception.
"""

import json
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.scraper_models import ScrapeJob
from app.core.exceptions import NotFoundException, ScrapingServiceException
from app.providers.html_extractor import HttpxHtmlExtractor
from app.schemas.scraper import ScrapeRequest


class ScraperService:
    """Service untuk mengelola scrape jobs dan menjalankan proses ekstraksi."""

    def __init__(self):
        self.extractor = HttpxHtmlExtractor()

    # ── Job Management ─────────────────────────────────────────

    async def create_job(
        self, db: AsyncSession, request: ScrapeRequest
    ) -> ScrapeJob:
        """Buat scrape job baru dengan status PENDING."""
        job = ScrapeJob(
            url=str(request.url),
            status="PENDING",
            formats=request.formats,
            json_schema=request.json_schema,
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    async def get_job(self, db: AsyncSession, job_id: UUID) -> ScrapeJob:
        """Ambil detail satu scrape job."""
        result = await db.execute(
            select(ScrapeJob).where(ScrapeJob.id == job_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            raise NotFoundException("ScrapeJob", str(job_id))
        return job

    async def list_jobs(
        self, db: AsyncSession, page: int = 1, page_size: int = 20
    ) -> dict:
        """List semua scrape jobs dengan paginasi."""
        # Count total
        count_result = await db.execute(
            select(func.count()).select_from(ScrapeJob)
        )
        total = count_result.scalar() or 0
        total_pages = max(1, (total + page_size - 1) // page_size)

        # Fetch page
        offset = (page - 1) * page_size
        result = await db.execute(
            select(ScrapeJob)
            .order_by(desc(ScrapeJob.created_at))
            .offset(offset)
            .limit(page_size)
        )
        jobs = result.scalars().all()

        return {
            "data": jobs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    async def get_stats(self, db: AsyncSession) -> dict:
        """Statistik scraping: total, success rate, avg time, ingested."""
        # Total jobs
        total_result = await db.execute(
            select(func.count()).select_from(ScrapeJob)
        )
        total = total_result.scalar() or 0

        # Completed jobs
        completed_result = await db.execute(
            select(func.count()).select_from(ScrapeJob).where(
                ScrapeJob.status == "COMPLETED"
            )
        )
        completed = completed_result.scalar() or 0

        # Failed jobs
        failed_result = await db.execute(
            select(func.count()).select_from(ScrapeJob).where(
                ScrapeJob.status == "FAILED"
            )
        )
        failed = failed_result.scalar() or 0

        # Total ingested feedbacks
        ingested_result = await db.execute(
            select(func.sum(ScrapeJob.ingest_count)).where(
                ScrapeJob.is_ingested == True  # noqa: E712
            )
        )
        total_ingested = ingested_result.scalar() or 0

        # Average processing time (completed jobs only)
        avg_time = None
        if completed > 0:
            avg_result = await db.execute(
                select(
                    func.avg(
                        func.extract(
                            "epoch",
                            ScrapeJob.completed_at - ScrapeJob.created_at,
                        )
                    )
                ).where(
                    ScrapeJob.status == "COMPLETED",
                    ScrapeJob.completed_at.isnot(None),
                )
            )
            avg_seconds = avg_result.scalar()
            if avg_seconds:
                avg_time = round(float(avg_seconds), 1)

        success_rate = round((completed / total * 100), 1) if total > 0 else 0

        return {
            "total_jobs": total,
            "completed": completed,
            "failed": failed,
            "success_rate": success_rate,
            "avg_time_seconds": avg_time,
            "total_ingested": total_ingested,
        }

    # ── Scraping Execution ─────────────────────────────────────

    async def process_scrape(self, db: AsyncSession, job_id: UUID) -> ScrapeJob:
        """
        Menjalankan proses scraping untuk satu job.
        Mendukung format: markdown, links, json, summary, html, images.
        """
        job = await self.get_job(db, job_id)

        # Update status
        job.status = "PROCESSING"
        await db.commit()

        try:
            # Step 1: Fetch HTML
            html = await self.extractor.fetch_html(job.url)

            # Step 2: Extract metadata (selalu)
            metadata = self.extractor.extract_metadata(html, job.url)
            job.result_metadata = metadata

            formats = job.formats or ["markdown"]

            # Step 3: Extract berdasarkan format yang diminta
            if "markdown" in formats:
                job.result_markdown = self.extractor.to_markdown(html)

            if "links" in formats:
                job.result_links = self.extractor.extract_links(html, job.url)

            if "html" in formats:
                job.result_html = self.extractor.get_clean_html(html)

            if "images" in formats:
                job.result_images = self.extractor.extract_images(html, job.url)

            if "json" in formats:
                markdown_content = job.result_markdown or self.extractor.to_markdown(html)
                job.result_json = await self._ai_structured_extract(
                    markdown_content, job.json_schema
                )

            if "summary" in formats:
                markdown_content = job.result_markdown or self.extractor.to_markdown(html)
                job.result_summary = await self._ai_summarize(markdown_content)

            # Step 4: Mark completed
            job.status = "COMPLETED"
            job.completed_at = datetime.now(timezone.utc)

        except ScrapingServiceException as e:
            job.status = "FAILED"
            job.error_message = str(e.message)
        except Exception as e:
            job.status = "FAILED"
            job.error_message = f"Unexpected error: {str(e)}"

        await db.commit()
        await db.refresh(job)
        return job

    async def _ai_summarize(self, markdown: str) -> str:
        """Menggunakan Gemini AI untuk merangkum konten halaman."""
        try:
            import google.generativeai as genai
            from app.core.config import get_settings

            settings = get_settings()
            genai.configure(api_key=settings.GEMINI_API_KEY)

            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=500,
                ),
            )

            truncated = markdown[:8000] if len(markdown) > 8000 else markdown

            response = await model.generate_content_async(
                f"""Rangkum konten web berikut menjadi 1-2 paragraf singkat dalam Bahasa Indonesia.
Fokus pada informasi utama dan poin penting. Jangan menambahkan informasi yang tidak ada di teks.

Teks web:

{truncated}"""
            )
            return response.text.strip()

        except Exception as e:
            return f"[Gagal merangkum: {str(e)}]"

    async def _ai_structured_extract(
        self, markdown: str, json_schema: dict | None = None
    ) -> dict:
        """
        Menggunakan Gemini AI untuk mengekstrak data terstruktur dari Markdown.
        Jika json_schema disediakan, AI akan mengembalikan data sesuai skema tersebut.
        """
        try:
            import google.generativeai as genai
            from app.core.config import get_settings

            settings = get_settings()
            genai.configure(api_key=settings.GEMINI_API_KEY)

            schema_instruction = ""
            if json_schema:
                schema_instruction = f"""
Ekstrak data dari teks di bawah ini dan kembalikan sebagai JSON yang sesuai dengan skema berikut:
{json.dumps(json_schema, indent=2)}
"""
            else:
                schema_instruction = """
Ekstrak informasi utama dari teks web di bawah ini dan kembalikan sebagai JSON dengan format:
{
  "title": "Judul halaman",
  "main_content": "Isi konten utama dalam 2-3 paragraf",
  "key_points": ["poin penting 1", "poin penting 2"],
  "entities_mentioned": ["nama entitas/organisasi yang disebutkan"],
  "sentiment": "POSITIVE atau NEGATIVE atau NEUTRAL",
  "language": "bahasa konten"
}
"""

            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    response_mime_type="application/json",
                ),
            )

            truncated = markdown[:8000] if len(markdown) > 8000 else markdown

            response = await model.generate_content_async(
                f"{schema_instruction}\n\nTeks web:\n\n{truncated}"
            )
            return json.loads(response.text)

        except Exception as e:
            return {"error": f"AI extraction failed: {str(e)}"}


# Singleton instance
scraper_service = ScraperService()
