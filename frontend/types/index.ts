/**
 * Global shared TypeScript types.
 * Mirrors backend Pydantic schemas.
 */

// ── Sentimen / Feedback ───────────────────────────────────────

export type Sentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL";
export type Emotion = "Marah" | "Panik" | "Sedih" | "Apresiasi" | "Harapan";

export interface FeedbackWithAnalysis {
  id: string;
  content: string;
  author_name: string | null;
  url: string | null;
  posted_at: string | null;
  scraped_at: string;
  source_name: string | null;
  target_entity_name: string | null;
  sentiment: Sentiment | null;
  emotion: Emotion | null;
  topics: string[] | null;
  needs_attention: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SentimentSummary {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface TopIssue {
  topic: string;
  count: number;
}

export interface DashboardOverview {
  sentiment_summary: SentimentSummary;
  top_issues: TopIssue[];
  total_feedbacks: number;
  total_unprocessed: number;
  total_needs_attention: number;
}

// ── Target Entity ─────────────────────────────────────────────

export interface TargetEntity {
  id: number;
  name: string;
  entity_type: string;
  keywords: string[] | null;
  pic_contact: string | null;
  created_at: string;
}

// ── Auth / RBAC ───────────────────────────────────────────────

export interface Permission {
  id: number;
  name: string;
  label: string | null;
  menu_id: number | null;
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
  label: string | null;
  created_at: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  roles: Role[];
}

export interface Menu {
  id: number;
  name: string;
  slug: string | null;
  route: string | null;
  icon: string | null;
  parent_id: number | null;
  order_no: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children: Menu[];
}

// ── Scraper ───────────────────────────────────────────────────

export type ScrapeStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ScrapeLink {
  url: string;
  text: string;
  is_external: boolean;
}

export interface ScrapeImage {
  src: string;
  alt: string;
  width: string | null;
  height: string | null;
}

export interface ScrapeMetadata {
  title: string;
  description: string;
  og_image: string;
  favicon: string;
  language: string;
  domain: string;
}

export interface ScrapeJob {
  id: string;
  url: string;
  status: ScrapeStatus;
  formats: string[] | null;
  result_markdown: string | null;
  result_links: ScrapeLink[] | null;
  result_json: Record<string, unknown> | null;
  result_metadata: ScrapeMetadata | null;
  result_summary: string | null;
  result_html: string | null;
  result_images: ScrapeImage[] | null;
  error_message: string | null;
  is_ingested: boolean;
  ingest_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface ScrapeJobListItem {
  id: string;
  url: string;
  status: ScrapeStatus;
  formats: string[] | null;
  error_message: string | null;
  is_ingested: boolean;
  ingest_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface ScrapeStats {
  total_jobs: number;
  completed: number;
  failed: number;
  success_rate: number;
  avg_time_seconds: number | null;
  total_ingested: number;
}

export interface IngestResult {
  job_id: string;
  feedbacks_created: number;
  feedbacks_skipped: number;
  auto_analyze_triggered: boolean;
}

// ── Crawler ───────────────────────────────────────────────────

export type CrawlStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface CrawlJob {
  id: string;
  url: string;
  status: CrawlStatus;
  max_depth: number;
  path_filter: string | null;
  limit_pages: number;
  delay_seconds: number;
  pages_discovered: number;
  pages_crawled: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface CrawledPage {
  id: string;
  url: string;
  title: string | null;
  markdown_snippet: string;
  status_code: number | null;
  crawled_at: string;
}

