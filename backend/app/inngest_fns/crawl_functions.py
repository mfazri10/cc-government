"""
Inngest Functions: Crawl Engine workflow.
Sesuai backend-patterns.md Section 5:
- step.run() untuk checkpoint asinkron.
- Politeness delay & rate-limiting.
- Sitemap mapping + BFS Discovery.
"""

import asyncio
import re
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse
from uuid import UUID

import inngest
from sqlalchemy import select

from app.core.database import async_session_factory
from app.core.crawl_models import CrawlJob, CrawledPage
from app.inngest_fns.client import inngest_client
from app.providers.html_extractor import HttpxHtmlExtractor
from app.services.crawl_service import crawl_service


@inngest_client.create_function(
    fn_id="execute-crawl-job",
    trigger=inngest.TriggerEvent(event="crawler/crawl.requested"),
    retries=1,
)
async def execute_crawl_job(
    ctx: inngest.Context,
    step: inngest.Step,
):
    """
    Workflow perayapan (crawling) asinkron:
    1. Ambil konfigurasi job dari DB.
    2. Jalankan URL Discovery (Sitemap + fallback BFS).
    3. Ekstrak konten per halaman secara iteratif dengan jeda (politeness).
    4. Simpan ke database dan perbarui progres real-time.
    """
    job_id = UUID(ctx.event.data["job_id"])

    # ── Step 1: Ambil data konfigurasi perayapan ────────────────
    async def fetch_job_config():
        async with async_session_factory() as db:
            job = await crawl_service.get_job(db, job_id)
            return {
                "url": job.url,
                "max_depth": job.max_depth,
                "path_filter": job.path_filter,
                "limit_pages": job.limit_pages,
                "delay_seconds": job.delay_seconds,
            }

    config = await step.run("fetch-job-config", fetch_job_config)

    # ── Step 2: URL Discovery (Sitemap.xml / BFS Fallback) ──────
    async def discover_urls_task():
        # Coba parse sitemap dahulu
        urls = await crawl_service.discover_urls_from_sitemap(config["url"])
        
        # Jika sitemap tidak menghasilkan apapun, lakukan rapid BFS traversal sampai limit terpenuhi
        if not urls:
            extractor = HttpxHtmlExtractor()
            visited = {config["url"]}
            queue = [(config["url"], 1)]  # (url, depth)
            discovered_list = [config["url"]]
            domain = urlparse(config["url"]).netloc

            while queue and len(discovered_list) < config["limit_pages"]:
                curr_url, depth = queue.pop(0)
                if depth > config["max_depth"]:
                    continue

                try:
                    # Ambil HTML ringan tanpa save ke db hanya untuk ekstraksi link
                    html = await extractor.fetch_html(curr_url)
                    links = extractor.extract_links(html, curr_url)

                    for link in links:
                        link_url = link["url"]
                        # Pastikan satu domain
                        if urlparse(link_url).netloc == domain:
                            # Terapkan path filter jika ada
                            if config["path_filter"]:
                                if not re.search(config["path_filter"], link_url):
                                    continue

                            if link_url not in visited:
                                visited.add(link_url)
                                discovered_list.append(link_url)
                                queue.append((link_url, depth + 1))

                                if len(discovered_list) >= config["limit_pages"]:
                                    break
                except Exception:
                    pass
            urls = discovered_list

        # Filter hasil akhir
        filtered_urls = []
        for u in urls:
            if config["path_filter"]:
                if not re.search(config["path_filter"], u):
                    continue
            filtered_urls.append(u)

        return filtered_urls[:config["limit_pages"]]

    discovered_urls = await step.run("discover-urls", discover_urls_task)

    # Update jumlah halaman yang ditemukan ke DB
    async def update_discovered():
        async with async_session_factory() as db:
            job = await crawl_service.get_job(db, job_id)
            job.status = "PROCESSING"
            job.pages_discovered = len(discovered_urls)
            await db.commit()

    await step.run("update-discovered-count", update_discovered)

    if not discovered_urls:
        async def mark_empty():
            async with async_session_factory() as db:
                job = await crawl_service.get_job(db, job_id)
                job.status = "COMPLETED"
                job.error_message = "Tidak ditemukan URL yang sesuai dengan kriteria filter."
                job.completed_at = datetime.now(timezone.utc)
                await db.commit()
        await step.run("mark-empty-job", mark_empty)
        return {"status": "empty"}

    # ── Step 3: Perayapan dan ekstraksi konten halaman ──────────
    extractor = HttpxHtmlExtractor()
    crawled_count = 0

    for idx, target_url in enumerate(discovered_urls):
        async def process_page_crawl():
            try:
                # Ambil HTML dan parsing
                html = await extractor.fetch_html(target_url)
                meta = extractor.extract_metadata(html, target_url)
                markdown = extractor.to_markdown(html)

                async with async_session_factory() as db:
                    # Simpan halaman hasil crawl
                    page = CrawledPage(
                        crawl_job_id=job_id,
                        url=target_url,
                        title=meta.get("title", "No Title"),
                        markdown=markdown,
                        status_code=200,
                    )
                    db.add(page)

                    # Update status progres di CrawlJob
                    job = await crawl_service.get_job(db, job_id)
                    job.pages_crawled += 1
                    await db.commit()
                return True
            except Exception as e:
                # Jika halaman gagal dimuat, catat log tapi jangan hentikan crawler
                async with async_session_factory() as db:
                    page = CrawledPage(
                        crawl_job_id=job_id,
                        url=target_url,
                        title="Failed to Crawl",
                        markdown=f"Error: {str(e)}",
                        status_code=500,
                    )
                    db.add(page)
                    await db.commit()
                return False

        success = await step.run(
            f"crawl-page-{idx}-{hash(target_url) % 100000}",
            process_page_crawl,
        )
        if success:
            crawled_count += 1

        # Terapkan politeness delay
        if idx < len(discovered_urls) - 1:
            await asyncio.sleep(config["delay_seconds"])

    # ── Step 4: Finalisasi Pekerjaan ────────────────────────────
    async def finalize_job():
        async with async_session_factory() as db:
            job = await crawl_service.get_job(db, job_id)
            job.status = "COMPLETED"
            job.completed_at = datetime.now(timezone.utc)
            await db.commit()

    await step.run("finalize-job", finalize_job)

    return {
        "status": "completed",
        "discovered": len(discovered_urls),
        "crawled": crawled_count,
    }


# Registration list
crawl_functions = [
    execute_crawl_job,
]
