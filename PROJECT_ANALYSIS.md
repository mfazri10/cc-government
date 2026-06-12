# 📊 Analisis Project: GOVMIND — Sentimen Warga Kota Cimahi

> **Tanggal Analisis:** 21 Mei 2026  
> **Versi Sistem:** 0.1.0 (Development)  
> **Analis:** Antigravity AI Code Assistant

---

## 1. Gambaran Umum Project

**GOVMIND** adalah platform *Command Center* berbasis AI untuk Pemerintah Kota Cimahi yang berfungsi mengumpulkan, menganalisis, dan memvisualisasikan **sentimen dan pengaduan warga** dari berbagai sumber publik secara otomatis.

### Stack Teknologi

| Layer | Teknologi |
|---|---|
| **Backend API** | Python · FastAPI · SQLAlchemy (async) · PostgreSQL |
| **AI / LLM** | Google Gemini 2.0 Flash (`google-generativeai`) |
| **Job Orchestration** | Inngest (event-driven + cron workers) |
| **Scraping** | BeautifulSoup4 · Httpx · Jina Reader API · Serper API |
| **Frontend** | Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 |
| **State Management** | Zustand v5 |
| **Charts** | Recharts |
| **Auth** | JWT (PyJWT) · RBAC (Role-Based Access Control) |
| **Alerting** | python-telegram-bot *(terkonfigurasi, belum diimplementasi)* |

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 16)                   │
│  Dashboard · Sentimen · Feedbacks · Scraper · Sources · EWS  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP (REST)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + Uvicorn)                │
│  Routers → Services → Providers (Gemini) → PostgreSQL       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                INNGEST (Background Jobs)             │    │
│  │  • process-unprocessed-feedbacks (event + cron)     │    │
│  │  • scheduled-datasource-sync (cron 02:00 pagi)      │    │
│  │  • execute-datasource-sync (event handler)          │    │
│  │  • crawl-site-job (event handler)                   │    │
│  │  • scraping-job-worker (event handler)              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
         ┌──────────────┐   ┌──────────────────┐
         │  PostgreSQL  │   │  Jina / Serper   │
         │   Database   │   │  External APIs   │
         └──────────────┘   └──────────────────┘
```

---

## 3. Kekuatan & Hal yang Sudah Baik ✅

### 3.1 Arsitektur Backend — Sangat Terstruktur
- **Clean Architecture** diterapkan dengan baik: `Router → Service → Provider`, tidak ada query DB di layer router.
- **Custom Exception Hierarchy** (`AppException`, `NotFoundException`, `DuplicateEntryException`, dst.) terpusat di `exceptions.py` dan di-handle secara global di `main.py`.
- **Adapter Pattern** pada Gemini (`BaseSentimentAnalyzer → GeminiSentimentAnalyzer`) memungkinkan penggantian provider AI tanpa mengubah kode bisnis.
- **Async throughout**: Semua query DB menggunakan `async/await` dengan `asyncpg` — cocok untuk beban I/O tinggi.

### 3.2 Pipeline Sentimen — Production-Ready
- **Event-driven Inngest**: Scraper memancarkan event, Inngest mengerjakan di background. Tidak memblokir HTTP thread.
- **Idempotent processing**: Worker hanya memproses `is_processed=False`, jadi retry aman tanpa duplikasi.
- **Dynamic API Key**: Gemini API key bisa diubah dari DB (`system_settings`) tanpa restart server.
- **Batch processing**: Menganalisis 10 feedback sekaligus untuk efisiensi API token.

### 3.3 Scraping Engine — Hybrid Approach
- **Serper API + DuckDuckGo fallback** untuk pencarian web.
- **Jina Reader** (`https://r.jina.ai/`) untuk mengekstrak artikel penuh bypass anti-bot.
- **Multi-format scraping**: Markdown, HTML, Links, Images, JSON.

### 3.4 RBAC (Role-Based Access Control)
- Sistem RBAC lengkap: Users → Roles → Permissions → Menus.
- Menu visibility dikontrol via permission per-role.
- JWT authentication dengan expiry 1440 menit.

### 3.5 Frontend — Modern & Responsif
- **Glassmorphism Design System** yang konsisten.
- **Zustand state management** yang ringan dan reaktif.
- **Server Actions** (Next.js) untuk data fetching, bukan client-side fetch langsung.
- **TypeScript** strict dengan tipe yang terdefinisi di `types/index.ts`.

---

## 4. Bug & Masalah yang Perlu Diperbaiki 🐛

### 4.1 [KRITIS] Route Order Bug — `/platforms` vs `/{id}` *(SUDAH DIPERBAIKI)*
**File:** `backend/app/api/routers/data_source_router.py`

Route `GET /platforms` dideklarasikan **setelah** route `GET /{id}`, sehingga FastAPI menangkap string `"platforms"` sebagai nilai integer `id` dan mengembalikan error 500.

**Status:** ✅ Sudah diperbaiki — route `/platforms` dipindahkan sebelum `/{id}`.

---

### 4.2 [SEDANG] Deprecated SDK: `google-generativeai`
**File:** `backend/requirements.txt`, `backend/app/providers/gemini_analyzer.py`, `backend/app/services/ingest_service.py`

```
FutureWarning: All support for the `google.generativeai` package has ended.
Please switch to the `google.genai` package.
```

SDK lama akan berhenti menerima update dan perbaikan bug. Semua kode yang menggunakan `import google.generativeai as genai` perlu dimigrasi ke `google-genai`.

**Dampak:** Model baru seperti Gemini 2.5 Flash tidak bisa diakses. Risiko breaking change di masa depan.

**Langkah Perbaikan:**
```bash
pip install google-genai
# Ubah: import google.generativeai as genai
# Menjadi: from google import genai
```

---

### 4.3 [SEDANG] Recharts Chart Width -1 Error
**File:** Frontend — `components/charts/SentimentPieChart.tsx`, `TopIssuesBarChart.tsx`

```
[browser] The width(-1) and height(-1) of chart should be greater than 0
```

Chart Recharts di-render sebelum container-nya punya dimensi nyata, terutama saat navigasi awal.

**Solusi:** Tambahkan `min-h-[200px]` pada wrapper container chart, atau gunakan `aspect-ratio` CSS.

---

### 4.4 [SEDANG] Gemini SDK Diinisialisasi Dua Kali
**File:** `backend/app/services/ingest_service.py` baris 121-133

`ingest_service.py` menginisialisasi Gemini SDK sendiri secara ad-hoc, bukan menggunakan singleton `GeminiSentimentAnalyzer`. Ini melanggar prinsip Adapter Pattern yang sudah ditetapkan di `backend-patterns.md` dan menyebabkan konfigurasi API key ganda.

**Solusi:** Refaktor `_split_content_with_ai` agar menggunakan `GeminiSentimentAnalyzer` atau buat provider terpisah `ContentSplitterProvider`.

---

### 4.5 [RENDAH] JWT Secret Key Hardcoded Default
**File:** `backend/app/core/config.py` baris 23

```python
JWT_SECRET_KEY: str = "govmind-secret-key-super-secure-change-it-in-env-98213892"
```

Secret key default yang hardcoded rentan jika developer lupa menggantinya di production.

**Solusi:** Tambahkan validasi startup yang memaksa penggantian jika `APP_ENV == "production"`.

---

### 4.6 [RENDAH] `langchain` Diinstall tapi Tidak Digunakan
**File:** `backend/requirements.txt`

Package `langchain==0.3.25` dan `langchain-google-genai` diinstall namun tidak ada kode yang menggunakannya secara aktif. Ini menambah beban instalasi ~200MB yang tidak perlu.

---

### 4.7 [RENDAH] `scrapling` Diinstall tapi Tidak Digunakan
**File:** `backend/requirements.txt`

Package `scrapling==0.2.99` terinstall tapi scraping dilakukan via `httpx` + `beautifulsoup4` dan Jina Reader. `scrapling` tidak digunakan di mana pun.

---

### 4.8 [RENDAH] ChromaDB Diinstall tapi Tidak Diimplementasi
**File:** `backend/requirements.txt`, `backend/app/core/config.py`

`chromadb==1.0.7` diinstall dan ada konfigurasi `CHROMA_PERSIST_DIR`, namun tidak ada kode yang menggunakan ChromaDB secara aktif. Ini adalah dependensi zombie.

---

### 4.9 [RENDAH] Batch Sentiment Processing Tidak Efisien
**File:** `backend/app/providers/gemini_analyzer.py` baris 98-115

Meskipun ada method `batch_analyze`, implementasinya memanggil `analyze()` satu per satu dalam loop (`for text in texts`). Tidak ada *true batch* — setiap teks masih menghasilkan satu HTTP roundtrip ke Gemini API.

**Solusi:** Kirim semua teks dalam satu prompt array terstruktur menggunakan JSON schema Gemini.

---

### 4.10 [RENDAH] Tidak Ada `updated_at` pada `DataSource`
**File:** `backend/app/core/models.py`

Model `DataSource` hanya memiliki `created_at` dan `last_scraped_at`. Tidak ada `updated_at` untuk melacak kapan terakhir data source diedit (misalnya URL diubah).

---

## 5. Fitur yang Perlu Ditambahkan 🚀

### 5.1 [PRIORITAS TINGGI] Early Warning System (EWS) — Notifikasi Telegram

**Status:** Infrastruktur ada (Telegram Bot token di config, `alerts_log` tabel di DB), tapi **belum diimplementasi**.

**Yang perlu dibuat:**
- Inngest worker baru: `trigger-ews-alert` yang dipicu jika `needs_attention == True` setelah analisis sentimen.
- Mapping `target_entity → pic_contact` (nomor HP/chat ID Telegram Kepala Dinas terkait).
- Fungsi pengiriman pesan ke Telegram Bot group OPD.
- Halaman **EWS / Alerts** di dashboard — tampilkan riwayat alert yang dikirim beserta statusnya (SENT / FAILED).

```python
# Contoh implementasi yang dibutuhkan:
@inngest_client.create_function(
    fn_id="trigger-ews-alert",
    trigger=inngest.TriggerEvent(event="ews/alert.triggered"),
)
async def trigger_ews_notification(ctx, step):
    entity_id = ctx.event.data["target_entity_id"]
    feedback_summary = ctx.event.data["summary"]
    # Kirim ke Telegram...
```

---

### 5.2 [PRIORITAS TINGGI] Tren Waktu / Time-Series Chart

Dashboard saat ini hanya menampilkan **snapshot statis** (total positif/negatif/neutral). Tidak ada grafik yang menunjukkan tren naik/turun dari waktu ke waktu.

**Yang perlu dibuat:**
- Endpoint baru: `GET /api/v1/analytics/trend?days=30&entity_id=X`
- Query SQL: group by tanggal, hitung sentimen per hari.
- Komponen frontend: `SentimentTrendLineChart` menggunakan Recharts `LineChart`.
- Filter: Per OPD, per rentang waktu (7 hari, 30 hari, 90 hari).

---

### 5.3 [PRIORITAS TINGGI] Export Laporan (PDF / Excel)

Pemerintah umumnya membutuhkan laporan tertulis. Saat ini tidak ada fitur ekspor data.

**Yang perlu dibuat:**
- Tombol "Export PDF" dan "Export Excel" di halaman Sentimen & Feedback.
- Backend: endpoint `GET /api/v1/analytics/export?format=pdf&days=30`.
- Library: `reportlab` (PDF) atau `openpyxl` (Excel) di backend Python.
- Frontend: download trigger via `<a href>` ke endpoint export.

---

### 5.4 [PRIORITAS TINGGI] Filter & Pencarian Feedback yang Lebih Lengkap

Halaman Feedback saat ini hanya bisa filter berdasarkan sentimen dan entity. Perlu diperluas:

**Yang perlu ditambahkan:**
- Filter berdasarkan **rentang tanggal** (`posted_at` range).
- Filter berdasarkan **topik/keyword** (cari di kolom `topics` array PostgreSQL).
- Filter berdasarkan **emosi** (Marah, Panik, Sedih, Apresiasi, Harapan).
- Filter berdasarkan **sumber** (Google Maps, Twitter, Berita Lokal, dll).
- **Full-text search** pada kolom `content`.

---

### 5.5 [PRIORITAS SEDANG] Dashboard Per-OPD

Saat ini dashboard menampilkan data agregat semua OPD. Diperlukan tampilan per-OPD:

**Yang perlu dibuat:**
- Dropdown "Pilih OPD" di header dashboard.
- Semua chart dan stat card berubah sesuai OPD yang dipilih.
- Halaman detail `GET /dashboard/target-entities/[id]` yang menampilkan:
  - Tren sentimen khusus OPD ini.
  - Top isu spesifik OPD ini.
  - Data source yang terhubung ke OPD ini.

---

### 5.6 [PRIORITAS SEDANG] Re-Analyze Feedback (Manual Trigger dari UI)

Saat ini tidak ada cara untuk mengulang analisis sentimen dari UI. Diperlukan:

**Yang perlu dibuat:**
- Tombol "Analisis Ulang" pada halaman Feedback.
- Endpoint: `POST /api/v1/feedbacks/[id]/reanalyze`.
- Menghapus record di `analyzed_feedbacks` dan set `is_processed=False` di `raw_feedbacks`.
- Memicu event Inngest `sentimen/process.requested`.

---

### 5.7 [PRIORITAS SEDANG] Halaman EWS / Alerts yang Fungsional

Halaman `/dashboard/alerts` ada di sidebar tapi belum diimplementasi (hanya placeholder).

**Yang perlu dibuat:**
- Tabel riwayat semua EWS alert dari `alerts_log`.
- Badge status: PENDING / SENT / FAILED / DELIVERED.
- Filter: per OPD, per tanggal.
- Tombol "Kirim Ulang" untuk alert yang gagal.
- Statistik: jumlah alert bulan ini per OPD.

---

### 5.8 [PRIORITAS SEDANG] Rate Limiting & API Throttling

Tidak ada proteksi terhadap penyalahgunaan API saat ini.

**Yang perlu ditambahkan:**
- `slowapi` middleware untuk rate limiting di FastAPI.
- Batas request per IP/user: misal 100 req/menit.
- Khusus endpoint berat (search, scrape): limit lebih ketat (10 req/menit).

---

### 5.9 [PRIORITAS SEDANG] Caching untuk Dashboard Analytics

Setiap kunjungan ke `/dashboard` memicu query agregasi berat ke PostgreSQL (JOIN `raw_feedbacks` + `analyzed_feedbacks` + GROUP BY).

**Yang perlu ditambahkan:**
- Redis cache dengan TTL 5 menit untuk endpoint analytics.
- `GET /analytics/dashboard` → cache key `dashboard:overview:30`.
- Invalidate cache saat ada feedback baru yang dianalisis.

---

### 5.10 [PRIORITAS RENDAH] Multi-Kota / Multi-Tenant Support

Saat ini sistem hard-coded untuk Kota Cimahi. Untuk skalabilitas:

**Yang perlu dipertimbangkan:**
- Kolom `city_id` / `tenant_id` pada `target_entities` dan `raw_feedbacks`.
- Login berbasis kota/instansi.
- Subdomain routing: `cimahi.govmind.id`, `bandung.govmind.id`.

---

### 5.11 [PRIORITAS RENDAH] Audit Log

Tidak ada pencatatan siapa yang melakukan apa di sistem (tambah data source, hapus feedback, ubah setting).

**Yang perlu dibuat:**
- Tabel `audit_logs`: `user_id`, `action`, `resource_type`, `resource_id`, `timestamp`.
- Middleware di FastAPI untuk mencatat setiap mutasi (POST/PUT/DELETE).
- Halaman log audit di pengaturan admin.

---

### 5.12 [PRIORITAS RENDAH] Notifikasi In-App (Real-time)

Saat ini notifikasi hanya via Telegram (belum aktif). Perlu notifikasi internal di dashboard:

**Yang perlu dibuat:**
- WebSocket endpoint di FastAPI untuk push notification.
- Bell icon di topbar dengan counter badge unread alerts.
- Dropdown notifikasi: "Banjir dilaporkan di Cibeureum — 5 menit lalu".

---

## 6. Rekomendasi Peningkatan Teknis 🔧

### 6.1 Migrasi ke SDK Gemini Terbaru
```bash
pip uninstall google-generativeai
pip install google-genai>=1.0
```
Update semua import dari `google.generativeai` ke `google.genai`.

### 6.2 Bersihkan Dependensi Tidak Digunakan
```bash
pip uninstall langchain langchain-google-genai scrapling chromadb
```
Estimasi pengurangan bobot instalasi: **~500MB**.

### 6.3 Tambahkan Database Indexing
Tambahkan composite index untuk query yang sering dieksekusi:
```sql
CREATE INDEX idx_raw_feedbacks_entity_date ON raw_feedbacks (target_entity_id, scraped_at DESC);
CREATE INDEX idx_analyzed_sentiment ON analyzed_feedbacks (sentiment, analyzed_at DESC);
CREATE INDEX idx_topics_gin ON analyzed_feedbacks USING GIN (topics);
```

### 6.4 Pagination pada Semua List Endpoint
Endpoint `GET /data-sources`, `GET /target-entities`, `GET /settings` belum memiliki pagination. Perlu ditambahkan sebelum data membesar.

### 6.5 Validasi URL pada DataSource Create
Endpoint `POST /data-sources` menerima URL apapun tanpa validasi. Tambahkan:
- Cek URL reachable sebelum disimpan.
- Validasi format URL via Pydantic `AnyHttpUrl`.

### 6.6 Implementasi True Batch Sentiment Analysis
Saat ini `batch_analyze()` memanggil satu per satu. Optimalkan:
```python
# Kirim semua teks dalam satu prompt dengan JSON schema array
prompt = f"Analisis {len(texts)} ulasan berikut dan kembalikan dalam JSON array..."
```

### 6.7 Tambahkan Health Check yang Lebih Lengkap
Endpoint `/health` saat ini hanya mengembalikan `{"status": "ok"}`. Perluas dengan:
```json
{
  "status": "ok",
  "database": "connected",
  "gemini_api": "configured", 
  "inngest": "connected",
  "version": "0.1.0",
  "uptime_seconds": 3600
}
```

---

## 7. Prioritas Implementasi (Roadmap)

| Fase | Fitur | Estimasi |
|---|---|---|
| **Fase 1 (Segera)** | Migrasi SDK Gemini baru | 1 hari |
| **Fase 1 (Segera)** | Fix Recharts chart width bug | 2 jam |
| **Fase 1 (Segera)** | Bersihkan dependensi tidak digunakan | 1 jam |
| **Fase 2 (Bulan Ini)** | EWS Telegram Notification | 3 hari |
| **Fase 2 (Bulan Ini)** | Time-series trend chart | 2 hari |
| **Fase 2 (Bulan Ini)** | Filter & search feedback lengkap | 2 hari |
| **Fase 2 (Bulan Ini)** | Halaman EWS / Alerts fungsional | 2 hari |
| **Fase 3 (Kuartal Ini)** | Export PDF / Excel | 3 hari |
| **Fase 3 (Kuartal Ini)** | Dashboard per-OPD | 4 hari |
| **Fase 3 (Kuartal Ini)** | Rate limiting & Redis caching | 2 hari |
| **Fase 3 (Kuartal Ini)** | Re-analyze feedback dari UI | 1 hari |
| **Fase 4 (Jangka Panjang)** | Multi-tenant / multi-kota | 2 minggu |
| **Fase 4 (Jangka Panjang)** | Audit log & notifikasi real-time | 1 minggu |

---

## 8. Kesimpulan

Project GOVMIND memiliki **fondasi arsitektur yang sangat kuat** untuk ukuran sistem pemerintahan — clean architecture, event-driven background jobs, dan AI integration yang elegan. Kode terstruktur dengan baik dan mengikuti pola konsisten.

**3 hal yang perlu segera ditangani:**
1. 🔴 Migrasi SDK Gemini ke `google-genai` (deprecated warning aktif)
2. 🟡 Fix Recharts chart dimension error di halaman Sentimen
3. 🟡 Implementasi EWS Telegram (infrastruktur ada, tinggal diaktifkan)

**Potensi terbesar untuk nilai bisnis:**
- 📈 Time-series trend chart — memungkinkan pemerintah melihat tren sentimen dari waktu ke waktu
- 📱 EWS Telegram — nilai operasional tinggi untuk respons cepat bencana/krisis
- 📄 Export laporan PDF/Excel — kebutuhan utama birokrasi pemerintahan

---

*Dokumen ini dibuat secara otomatis melalui analisis kode sumber. Terakhir diperbarui: 21 Mei 2026.*
