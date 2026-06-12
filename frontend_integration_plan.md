# 🏗️ Rencana Integrasi Frontend & Backend — GOVMIND Sentimen Warga

Dokumen ini mendokumentasikan fitur-fitur pada aplikasi frontend (Next.js) yang saat ini masih menggunakan data statis (*mock data*), beserta panduan langkah demi langkah untuk menghubungkannya secara langsung dengan API backend (FastAPI).

---

## 🎯 Peta Integrasi Fitur Utama

Berikut adalah daftar halaman frontend yang masih menggunakan data statis, beserta pemetaan API backend yang tepat:

| No | Nama Halaman | Lokasi Berkas Frontend | Status Data | Endpoint API Backend Terkait | Hubungan Fungsional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Dashboard Overview** | [`frontend/app/dashboard/page.tsx`](file:///c:/Users/ASUS/Desktop/python-next-boilerplate/frontend/app/dashboard/page.tsx) | 🔴 Mock Data | `GET /api/v1/analytics/dashboard` | Menampilkan total feedback, statistik sentimen, jumlah feedback belum diproses, kasus darurat (*needs attention*), serta grafik overview sentimen dan isu teratas. |
| **2** | **Sentimen Analytics** | [`frontend/app/dashboard/sentimen/page.tsx`](file:///c:/Users/ASUS/Desktop/python-next-boilerplate/frontend/app/dashboard/sentimen/page.tsx) | 🔴 Mock Data | `GET /api/v1/analytics/sentiment-summary` <br> `GET /api/v1/analytics/top-issues` | Halaman khusus analisis tren sentimen (Pie Chart) dan bar chart 10 isu teratas yang merangkum keluhan publik. Mendukung filter waktu (7, 30, 90 hari). |
| **3** | **Feedback Explorer** | [`frontend/app/dashboard/feedbacks/page.tsx`](file:///c:/Users/ASUS/Desktop/python-next-boilerplate/frontend/app/dashboard/feedbacks/page.tsx) | 🔴 Mock Data | `GET /api/v1/feedbacks/` | Menampilkan tabel paginasi dari semua ulasan warga yang telah dianotasi oleh AI (sentimen, emosi, topik). Mendukung filter dinamis berdasarkan sentimen dan OPD. |
| **4** | **Target Entities** | [`frontend/app/dashboard/target-entities/page.tsx`](file:///c:/Users/ASUS/Desktop/python-next-boilerplate/frontend/app/dashboard/target-entities/page.tsx) | 🔴 Mock Data | `GET /api/v1/target-entities/` <br> `POST /api/v1/target-entities/` <br> `DELETE /api/v1/target-entities/{id}` | Manajemen Organisasi Perangkat Daerah (OPD) dan fasilitas kesehatan publik (RSUD, Puskesmas). |
| **5** | **Manajemen User** | [`frontend/app/dashboard/users/page.tsx`](file:///c:/Users/ASUS/Desktop/python-next-boilerplate/frontend/app/dashboard/users/page.tsx) | 🔴 Mock Data | `GET /api/v1/users` <br> `POST /api/v1/users` <br> `PATCH /api/v1/users/{id}` | Pengelolaan akun pengguna internal pemerintahan, perannya (roles), dan data otentikasinya. |
| **6** | **Manajemen Role** | [`frontend/app/dashboard/roles/page.tsx`](file:///c:/Users/ASUS/Desktop/python-next-boilerplate/frontend/app/dashboard/roles/page.tsx) | 🔴 Mock Data | `GET /api/v1/roles` | Manajemen peran (RBAC) dan izin akses menu (permissions). |

---

## 🛠️ Langkah Integrasi Per Komponen

### 1. Dashboard Overview
Ganti `const mockData` di [`page.tsx`](file:///c:/Users/ASUS/Desktop/python-next-boilerplate/frontend/app/dashboard/page.tsx) dengan integrasi server action:

* **Server Action Baru (`frontend/features/dashboard/actions.ts`)**:
```typescript
"use server";

import { apiGet } from "@/lib/api";
import type { DashboardOverview } from "@/types";

export async function fetchDashboardOverview(days: number = 30): Promise<DashboardOverview> {
  return apiGet<DashboardOverview>("/api/v1/analytics/dashboard", { days });
}
```

* **Modifikasi Halaman (`frontend/app/dashboard/page.tsx`)**:
```typescript
import { fetchDashboardOverview } from "@/features/dashboard/actions";

export default async function DashboardPage() {
  const data = await fetchDashboardOverview(30);
  
  return (
    // ... Render StatCard & Charts menggunakan variabel `data`
  );
}
```

---

### 2. Sentimen Analytics
Tautkan pemilih filter waktu (7, 30, atau 90 hari) dengan query dinamis ke backend:

* **Server Action Baru (`frontend/features/analytics/actions.ts`)**:
```typescript
"use server";

import { apiGet } from "@/lib/api";
import type { SentimentSummary, TopIssue } from "@/types";

export async function fetchSentimentSummary(days: number): Promise<SentimentSummary> {
  return apiGet<SentimentSummary>("/api/v1/analytics/sentiment-summary", { days });
}

export async function fetchTopIssues(days: number, limit: number = 10): Promise<TopIssue[]> {
  return apiGet<TopIssue[]>("/api/v1/analytics/top-issues", { days, limit });
}
```

* **Modifikasi Halaman (`frontend/app/dashboard/sentimen/page.tsx`)**:
Ubah komponen menjadi Client Component (`"use client"`) atau kelola parameter via Search Params (Server Component):
```typescript
// Menggunakan Search Params untuk filtering di Server Component
interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function SentimenPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const days = resolvedParams.days ? parseInt(resolvedParams.days, 10) : 30;

  const sentiment = await fetchSentimentSummary(days);
  const issues = await fetchTopIssues(days);

  return (
    // ... Kirim data `sentiment` dan `issues` ke PieChart dan BarChart
  );
}
```

---

### 3. Feedback Explorer (Tabel Paginasi)
Halaman ini membutuhkan server-side pagination dan filter dinamis sentimen serta OPD.

* **Server Action Baru (`frontend/features/feedbacks/actions.ts`)**:
```typescript
"use server";

import { apiGet } from "@/lib/api";
import type { PaginatedResponse } from "@/types";

interface FetchFeedbacksParams {
  page?: number;
  pageSize?: number;
  sentiment?: string;
  entityId?: number;
}

export async function fetchFeedbacks(params: FetchFeedbacksParams): Promise<PaginatedResponse> {
  const queryParams: Record<string, string | number> = {};
  if (params.page) queryParams.page = params.page;
  if (params.pageSize) queryParams.page_size = params.pageSize;
  if (params.sentiment) queryParams.sentiment = params.sentiment;
  if (params.entityId) queryParams.entity_id = params.entityId;

  return apiGet<PaginatedResponse>("/api/v1/feedbacks/", queryParams);
}
```

---

### 4. Target Entities (CRUD)
Daftar OPD/Fasilitas harus langsung dibaca dari tabel `target_entities` di database.

* **Server Action Baru (`frontend/features/target-entities/actions.ts`)**:
```typescript
"use server";

import { api, apiGet } from "@/lib/api";

export interface TargetEntity {
  id: number;
  name: string;
  entity_type: string;
  keywords: string[];
  pic_contact: string | null;
}

export async function fetchTargetEntities(): Promise<TargetEntity[]> {
  return apiGet<TargetEntity[]>("/api/v1/target-entities/");
}

export async function createTargetEntity(data: { name: string; entity_type: string; keywords: string[]; pic_contact?: string }) {
  return api<TargetEntity>("/api/v1/target-entities/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
```

---

## 💡 Tips & Rekomendasi Integrasi

> [!IMPORTANT]
> - **Server Component Pertama**: Selalu utamakan pengambilan data menggunakan Server Component bawaan Next.js untuk merender struktur utama halaman (SEO optimal & load kilat).
> - **Interaktivitas via Client Component**: Untuk pemilih filter (seperti dropdown jumlah hari atau sentimen), gunakan `"use client"` yang memperbarui URL `searchParams` menggunakan `router.push('?days=7')`. Perubahan URL ini akan men-trigger pengambilan data server baru secara instan dan reaktif.
> - **Bypass Cookie**: Pastikan request API Next.js Server Action ke backend FastAPI menyertakan header otentikasi atau cookie sesi jika Anda memutuskan untuk mengaktifkan proteksi rute di masa mendatang.
