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
