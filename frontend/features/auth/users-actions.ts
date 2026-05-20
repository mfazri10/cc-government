"use server";

import { apiGet } from "@/lib/api";
import type { User } from "@/types";

/**
 * Mengambil seluruh daftar user beserta roles dari backend.
 */
export async function fetchUsers(): Promise<User[]> {
  return apiGet<User[]>("/api/v1/users");
}
