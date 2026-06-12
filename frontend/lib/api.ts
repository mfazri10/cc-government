import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

/**
 * Fetch wrapper dengan base URL, error handling, dan query params otomatis.
 */
export async function api<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build query string
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  // Dapatkan token dari cookie secara asinkron (Server Context)
  const cookieStore = await cookies();
  const token = cookieStore.get("session-token")?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers,
    ...fetchOptions,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `API Error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return {} as T;

  return response.json();
}

// Shorthand methods
export const apiGet = <T>(endpoint: string, params?: Record<string, string | number | undefined>) =>
  api<T>(endpoint, { method: "GET", params });

export const apiPost = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: "POST", body: JSON.stringify(body) });

export const apiPut = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: "PUT", body: JSON.stringify(body) });

export const apiPatch = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) });

export const apiDelete = (endpoint: string) =>
  api(endpoint, { method: "DELETE" });
