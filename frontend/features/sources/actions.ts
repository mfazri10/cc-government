"use server";

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { DataSource, SourcePlatform } from "@/types";

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

/**
 * Membuat Data Source baru.
 */
export async function createDataSource(
  data: { name: string; url: string; source_id: number; target_entity_id: number; status: string }
): Promise<DataSource> {
  return apiPost<DataSource>("/api/v1/data-sources", data);
}

/**
 * Menghapus Data Source.
 */
export async function deleteDataSource(id: number): Promise<boolean> {
  await apiDelete(`/api/v1/data-sources/${id}`);
  return true;
}

/**
 * Mengambil semua Platform (Sources) yang tersedia.
 */
export async function fetchPlatforms(): Promise<SourcePlatform[]> {
  return apiGet<SourcePlatform[]>("/api/v1/data-sources/platforms");
}
