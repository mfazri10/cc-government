"use server";

import { apiGet } from "@/lib/api";
import type { DashboardOverview, SentimentSummary, TopIssue } from "@/types";

export async function fetchDashboardOverview(days: number = 30): Promise<DashboardOverview> {
  return apiGet<DashboardOverview>("/api/v1/analytics/dashboard", { days });
}

export async function fetchSentimentSummary(days: number = 30): Promise<SentimentSummary> {
  return apiGet<SentimentSummary>("/api/v1/analytics/sentiment-summary", { days });
}

export async function fetchTopIssues(days: number = 30, limit: number = 10): Promise<TopIssue[]> {
  return apiGet<TopIssue[]>("/api/v1/analytics/top-issues", { days, limit });
}
