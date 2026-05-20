"use server";

import { apiGet } from "@/lib/api";
import type { Role, Permission } from "@/types";

/**
 * Mengambil seluruh daftar roles beserta permissions dari backend.
 */
export async function fetchRoles(): Promise<Role[]> {
  return apiGet<Role[]>("/api/v1/roles");
}

/**
 * Mengambil seluruh daftar permissions dari backend.
 */
export async function fetchPermissions(): Promise<Permission[]> {
  return apiGet<Permission[]>("/api/v1/permissions");
}
