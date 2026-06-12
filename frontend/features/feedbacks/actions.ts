"use server";

import { apiGet } from "@/lib/api";
import type { FeedbackWithAnalysis, PaginatedResponse } from "@/types";

interface FetchFeedbacksParams {
  page?: number;
  page_size?: number;
  sentiment?: string;
  entity_id?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
  source_id?: number;
  needs_attention?: boolean;
}

export async function fetchFeedbacks(
  params: FetchFeedbacksParams = {}
): Promise<PaginatedResponse<FeedbackWithAnalysis>> {
  return apiGet<PaginatedResponse<FeedbackWithAnalysis>>("/api/v1/feedbacks", {
    page: params.page || 1,
    page_size: params.page_size || 20,
    sentiment: params.sentiment,
    entity_id: params.entity_id,
    search: params.search,
    start_date: params.start_date,
    end_date: params.end_date,
    source_id: params.source_id,
    needs_attention: params.needs_attention,
  });
}
