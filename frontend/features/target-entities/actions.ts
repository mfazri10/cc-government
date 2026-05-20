"use server";

import { apiGet } from "@/lib/api";
import type { TargetEntity } from "@/types";

/**
 * Mengambil seluruh daftar target entities (OPD/Fasilitas) dari backend.
 */
export async function fetchTargetEntities(): Promise<TargetEntity[]> {
  return apiGet<TargetEntity[]>("/api/v1/target-entities/");
}
