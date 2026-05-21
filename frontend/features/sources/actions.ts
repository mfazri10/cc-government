"use server";

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { DataSource } from "@/types";

/**
 * Mengambil semua Data Sources.
 */
export async function fetchDataSources(): Promise<DataSource[]> {
  return apiGet<DataSource[]>("/api/v1/data-sources");
}

/**
 * Memicu manual scrape untuk suatu Data Source (misal via Inngest).
 */
export async function triggerManualScrape(id: number): Promise<{ message: string; status: string }> {
  return apiPost<{ message: string; status: string }>(`/api/v1/data-sources/${id}/scrape`, {});
}
