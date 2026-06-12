# 🗺️ Roadmap Pengerjaan: Sentimen Warga (Step-by-Step)

Berikut adalah panduan pengerjaan langkah demi langkah, terstruktur dari fondasi _backend_ hingga visualisasi di _frontend_.

---

## 🛠️ FASE 1: Fondasi Backend & Database (Estimasi: 1-2 Hari)
_Fokus: Menyiapkan rumah untuk data dan kerangka dasar API._

1. **Inisialisasi Project FastAPI**
   - Buat virtual environment (venv) & install _dependencies_ utama: `fastapi`, `uvicorn`, `sqlalchemy` (atau `sqlmodel`), `psycopg2-binary`, `python-dotenv`.
   - Setup struktur folder (misal: `app/models`, `app/routes`, `app/services`).

2. **Setup Database PostgreSQL**
   - Buat instance Postgres (bisa lokal via Docker atau cloud seperti Supabase/Neon).
   - Implementasikan skema dari `sentimen-warga-db.md` menjadi model SQLAlchemy/SQLModel.
   - Jalankan migrasi awal (Alembic) untuk membuat tabel `sources`, `target_entities`, `raw_feedbacks`, `analyzed_feedbacks`, dll.

3. **Inisialisasi ChromaDB (Opsional di awal)**
   - Install `chromadb`.
   - Buat _service_ sederhana untuk connect ke _collection_ `feedback_embeddings`.

---

## 🕷️ FASE 2: Data Ingestion Pipeline (Estimasi: 2-3 Hari)
_Fokus: Mengambil data dari luar menggunakan Scrapling._

1. **Setup Scrapling Engine**
   - Install library: `pip install scrapling`
   - Buat class/service `ScraperService`.
2. **Membuat Scraper Module 1: Google Maps / Ulasan Web**
   - Buat skrip Scrapling untuk menembus URL target (misal ulasan RSUD) dan mengekstrak daftar _review_ (nama, teks, waktu).
3. **Membuat API Endpoint Trigger (Testing)**
   - Buat endpoint `POST /api/v1/scrape/trigger` untuk menjalankan scraper secara manual dan menyimpan hasilnya ke tabel `raw_feedbacks` (dengan status `is_processed: false`).

---

## 🧠 FASE 3: Orchestrasi Inngest & NLP Gemini (Estimasi: 3-4 Hari)
_Fokus: Mengolah data mentah menjadi data bermakna secara asinkron._

1. **Setup Inngest Python SDK**
   - Install `inngest` Python SDK.
   - Konfigurasi Inngest Client di dalam FastAPI.
2. **Membuat Prompt Engineering Gemini**
   - Install `google-generativeai`.
   - Buat sistem _prompt_ agar Gemini membalas dengan format JSON terstruktur (mengandung sentimen, emosi, topik, dll).
3. **Membuat Inngest Step Functions (The Core Workflow)**
   - **Step 1:** Ambil 10 data dari `raw_feedbacks` yang `is_processed == False`.
   - **Step 2:** Lempar teks mentah ke Gemini Flash.
   - **Step 3:** Simpan hasil JSON ke tabel `analyzed_feedbacks`.
   - **Step 4:** _Upsert_ teks dan metadata ke ChromaDB.
   - **Step 5:** Ubah `is_processed` menjadi `True`.

---

## 🚨 FASE 4: API Presentation & Alerting (Estimasi: 2 Hari)
_Fokus: Menyiapkan data untuk disajikan ke Dashboard dan Sistem Peringatan._

1. **Membuat Endpoint Analitik untuk Frontend**
   - `GET /api/v1/analytics/sentiment-summary` (Total positif/negatif/netral per rentang waktu).
   - `GET /api/v1/analytics/top-issues` (Daftar keluhan terbanyak).
   - `GET /api/v1/feedbacks` (Tabel data lengkap dengan fitur filter & pagination).
2. **Membuat Sistem Alerting (Telegram)**
   - Buat Inngest Cron Job (berjalan tiap jam).
   - Logic: Hitung jumlah keluhan bersentimen `NEGATIVE` hari ini vs kemarin. Jika naik > 100%, trigger pengiriman pesan via Telegram API ke grup PIC.
   - Catat log ke tabel `alerts_log`.

---

## 💻 FASE 5: Frontend / Dashboard Next.js (Estimasi: 3-4 Hari)
_Fokus: Membangun UI (User Interface) yang interaktif dan visual._

1. **Setup Layout & State Management**
   - Gunakan repository Next.js yang sudah ada.
   - Buat halaman khusus `/dashboard/sentimen`.
2. **Integrasi Visualisasi Data (Chart.js / Recharts)**
   - Buat **Pie Chart** untuk persentase Sentimen (Positif, Negatif, Netral).
   - Buat **Bar Chart / Line Chart** untuk tren emosi harian (Marah, Sedih, Apresiasi).
3. **Membangun Komponen "Live Feed" & Tabel**
   - Buat list UI untuk menampilkan keluhan warga secara _real-time_ (mirip timeline Twitter).
   - Buat tabel detail yang mendukung _filtering_ berdasarkan OPD/Instansi.
4. **Wiring & Final Polish**
   - Sambungkan semua _component_ frontend dengan endpoint FastAPI yang dibuat di Fase 4.
   - Tambahkan _loading states_ dan _error handling_.

---

## 🏁 Ringkasan Urutan Kerja (Checklist Harian)

- [ ] **Hari 1:** Setup FastAPI, PostgreSQL, buat tabel DB.
- [ ] **Hari 2:** Buat skrip Scrapling pertama, simpan ke `raw_feedbacks`.
- [ ] **Hari 3:** Hubungkan API Gemini, buat Inngest worker dasar.
- [ ] **Hari 4:** Selesaikan _pipeline_ Inngest (dari _raw_ -> Gemini -> ChromaDB).
- [ ] **Hari 5:** Buat endpoint analitik di FastAPI & integrasi Telegram Bot.
- [ ] **Hari 6:** Setup UI Frontend Next.js (buat chart, layout).
- [ ] **Hari 7:** Wiring data API ke Frontend & testing _end-to-end_.
