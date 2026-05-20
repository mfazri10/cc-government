"use server";

import { api, apiGet } from "@/lib/api";

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Mengambil konfigurasi sistem berdasarkan key dari backend.
 */
export async function fetchSetting(key: string): Promise<SystemSetting> {
  return apiGet<SystemSetting>(`/api/v1/settings/${key}`);
}

/**
 * Memperbarui nilai konfigurasi sistem di backend.
 */
export async function updateSetting(key: string, value: string): Promise<SystemSetting> {
  return api<SystemSetting>(`/api/v1/settings/${key}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}
