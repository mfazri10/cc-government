"use server";

import { apiPost } from "@/lib/api";
import { cookies } from "next/headers";

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message: string;
}

export interface ActionResponse {
  success: boolean;
  error?: string;
  user?: User;
}

/**
 * Melakukan proses login dengan mengirimkan request ke backend,
 * menyimpan session token di cookie, dan mengembalikan data user.
 */
export async function loginAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email dan password wajib diisi." };
  }

  try {
    const response = await apiPost<LoginResponse>("/api/v1/login", { email, password });

    const cookieStore = await cookies();
    
    // Simpan token di cookie selama 1 hari
    cookieStore.set("session-token", response.token, {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Simpan user info di cookie (httpOnly: false agar bisa dibaca di client jika diperlukan)
    cookieStore.set("user-info", JSON.stringify(response.user), {
      path: "/",
      maxAge: 60 * 60 * 24,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return { success: true, user: response.user };
  } catch (error: any) {
    return { success: false, error: error.message || "Email atau password salah." };
  }
}

/**
 * Keluar dari sesi login (hapus cookie).
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session-token");
  cookieStore.delete("user-info");
  return { success: true };
}
