"use server";

import { apiGet } from "@/lib/api";
import type { FeedbackWithAnalysis, PaginatedResponse } from "@/types";

interface FetchFeedbacksParams {
  page?: number;
  page_size?: number;
  sentiment?: string;
  entity_id?: number;
}

export async function fetchFeedbacks(
  params: FetchFeedbacksParams = {}
): Promise<PaginatedResponse<FeedbackWithAnalysis>> {
  return apiGet<PaginatedResponse<FeedbackWithAnalysis>>("/api/v1/feedbacks", {
    page: params.page || 1,
    page_size: params.page_size || 20,
    sentiment: params.sentiment,
    entity_id: params.entity_id,
  });
}
