"use server";

import { apiGet, apiPost } from "@/lib/api";
import type {
  ScrapeJob,
  ScrapeJobListItem,
  ScrapeStats,
  IngestResult,
  PaginatedResponse,
  CrawlJob,
  CrawledPage,
  SearchQueryResponse,
  SearchQueryResultItem,
} from "@/types";

interface SubmitScrapeParams {
  url: string;
  formats: string[];
  json_schema?: Record<string, unknown>;
}

/**
 * Submit scrape job baru ke backend.
 */
export async function submitScrapeJob(
  params: SubmitScrapeParams
): Promise<ScrapeJob> {
  return apiPost<ScrapeJob>("/api/v1/scraper/scrape", {
    url: params.url,
    formats: params.formats,
    json_schema: params.json_schema || null,
  });
}

/**
 * Ambil daftar scrape jobs (paginated).
 */
export async function fetchScrapeJobs(
  page: number = 1,
  page_size: number = 20
): Promise<PaginatedResponse<ScrapeJobListItem>> {
  return apiGet<PaginatedResponse<ScrapeJobListItem>>(
    "/api/v1/scraper/jobs",
    { page, page_size }
  );
}

/**
 * Ambil detail satu scrape job beserta hasilnya.
 */
export async function fetchScrapeJob(id: string): Promise<ScrapeJob> {
  return apiGet<ScrapeJob>(`/api/v1/scraper/jobs/${id}`);
}

/**
 * Ambil statistik scraping keseluruhan.
 */
export async function fetchScrapeStats(): Promise<ScrapeStats> {
  return apiGet<ScrapeStats>("/api/v1/scraper/stats");
}

/**
 * Ingest hasil scraping ke pipeline sentimen (raw_feedbacks).
 */
export async function ingestScrapeResults(
  jobId: string,
  sourceId: number,
  targetEntityId?: number,
  autoAnalyze: boolean = true
): Promise<IngestResult> {
  return apiPost<IngestResult>("/api/v1/scraper/ingest", {
    job_id: jobId,
    source_id: sourceId,
    target_entity_id: targetEntityId || null,
    auto_analyze: autoAnalyze,
  });
}

interface SubmitCrawlParams {
  url: string;
  max_depth: number;
  path_filter?: string;
  limit_pages: number;
  delay_seconds: number;
}

/**
 * Submit crawl job baru untuk perayapan domain/sitemap.
 */
export async function submitCrawlJob(
  params: SubmitCrawlParams
): Promise<CrawlJob> {
  return apiPost<CrawlJob>("/api/v1/crawler/crawl", {
    url: params.url,
    max_depth: params.max_depth,
    path_filter: params.path_filter || null,
    limit_pages: params.limit_pages,
    delay_seconds: params.delay_seconds,
  });
}

/**
 * Ambil riwayat pekerjaan crawling (paginated).
 */
export async function fetchCrawlJobs(
  page: number = 1,
  page_size: number = 10
): Promise<PaginatedResponse<CrawlJob>> {
  return apiGet<PaginatedResponse<CrawlJob>>("/api/v1/crawler/jobs", {
    page,
    page_size,
  });
}

/**
 * Ambil daftar halaman yang berhasil dirayap dari satu job.
 */
export async function fetchCrawledPages(
  jobId: string
): Promise<CrawledPage[]> {
  return apiGet<CrawledPage[]>(`/api/v1/crawler/jobs/${jobId}/pages`);
}

// ── Search Engine Discover ────────────────────────────────────

/**
 * Lakukan pencarian global (Discover) ke backend.
 */
export async function performSearch(
  query: string,
  sources: string[],
  limit: number = 10
): Promise<SearchQueryResponse> {
  return apiPost<SearchQueryResponse>("/api/v1/scraper/search", {
    query,
    sources,
    limit,
  });
}

/**
 * Ingest (Simpan) hasil pencarian terpilih ke pipeline sentimen.
 */
export async function ingestSearchResults(
  items: SearchQueryResultItem[],
  targetEntityId?: number
): Promise<{ ingested_count: number; skipped_count: number; message: string }> {
  return apiPost<{ ingested_count: number; skipped_count: number; message: string }>(
    "/api/v1/scraper/search/ingest",
    {
      target_entity_id: targetEntityId || null,
      items,
    }
  );
}
