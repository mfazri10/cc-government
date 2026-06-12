# 📋 Master Feature List — GovMind Scraping Engine

Dokumen ini merangkum **seluruh fitur** yang perlu dibangun untuk Scraping Engine GovMind, mencakup apa yang sudah selesai (Fase 1) dan apa yang belum diimplementasikan. Diorganisir berdasarkan modul dan prioritas.

---

## ✅ Sudah Dibangun (Fase 1 — Selesai)

### Backend
- [x] ORM Model `ScrapeJob` (tabel `scrape_jobs` di PostgreSQL)
- [x] REST API: `POST /scraper/scrape`, `GET /scraper/jobs`, `GET /scraper/jobs/{id}`
- [x] Provider Adapter: `HttpxHtmlExtractor` (httpx + BeautifulSoup + markdownify)
- [x] Multi-format extraction: **Markdown**, **Links**, **Metadata**
- [x] AI Structured Extraction: **JSON Mode** via Gemini (custom JSON Schema support)
- [x] Inngest workflow skeleton (`scraping/url.requested`)
- [x] Alembic migration untuk `scrape_jobs`

### Frontend
- [x] Halaman `/dashboard/scraper` dengan tab navigation (Search/Scrape/Crawl)
- [x] Interactive `ScrapeForm` — URL input + format selector grid
- [x] `ScrapeResultViewer` — tabbed viewer (Markdown/Links/JSON/Metadata) + copy-to-clipboard
- [x] `ScrapeJobsList` — riwayat scraping dengan status badges
- [x] Nav item "Scraper" di Sidebar

---

## 🔲 Belum Dibangun — Daftar Fitur Lengkap

### A. Data Pipeline: Scrape → Ingest → Analisis Sentimen
> Menghubungkan hasil scraping langsung ke pipeline analisis sentimen yang sudah ada.

- [ ] **Auto-Ingest ke `raw_feedbacks`**: Setelah scraping selesai, konten yang relevan otomatis dipecah per-komentar/ulasan dan disimpan ke tabel `raw_feedbacks`
- [ ] **Bulk Content Splitter**: Memecah satu halaman panjang menjadi beberapa unit feedback individu (per-paragraf / per-komentar) menggunakan AI
- [ ] **Source Tagging**: Setiap feedback yang diingest otomatis ditandai dengan `source_id` dan `target_entity_id` yang relevan
- [ ] **Deduplikasi**: Cek `original_post_id` untuk mencegah feedback yang sama diproses ulang
- [ ] **Auto-trigger Inngest**: Setelah ingest, otomatis emit event `sentimen/process.requested` agar Gemini langsung menganalisis batch baru

---

### B. Extract: Fitur Scraping Lanjutan

- [ ] **Screenshot Mode**: Mengambil full-page screenshot menggunakan Playwright sebagai bukti visual
- [ ] **Summary Mode**: AI merangkum konten halaman menjadi 1-2 paragraf singkat
- [ ] **Question Mode**: Mengajukan pertanyaan spesifik pada AI mengenai konten halaman (misal: "Siapa PIC yang bertanggung jawab?")
- [ ] **Images Extractor**: Menarik semua gambar beserta alt text dari halaman
- [ ] **Branding Scraper**: Mengekstrak logo, palet warna, dan font dari situs web target
- [ ] **HTML Raw Output**: Menyimpan HTML mentah yang sudah dibersihkan sebagai format output tambahan

---

### C. Interact: Dynamic Page Actions (Playwright)

- [ ] **Playwright Integration**: Mengganti/melengkapi httpx dengan Playwright untuk halaman dinamis (SPA)
- [ ] **Click Action**: Simulasi klik tombol "Muat Lebih Banyak", "Accept Cookies", dll
- [ ] **Scroll Action**: Auto-scroll halaman infinite scroll untuk memuat seluruh konten
- [ ] **Wait Action**: Menunggu elemen DOM spesifik termuat sebelum ekstraksi
- [ ] **Form Input Action**: Mengisi kolom pencarian internal situs target sebelum data ditarik
- [ ] **Interact Configuration UI**: Frontend form untuk menambahkan urutan aksi sebelum scraping

---

### D. Crawl: Sitemap Mapping & Recursive Crawler

- [ ] **Fast URL Mapping (Map)**: Endpoint untuk mem-parse `sitemap.xml` dan mengembalikan daftar seluruh URL aktif di domain
- [ ] **Recursive Crawler**: Perayapan halaman demi halaman secara rekursif dari satu root URL
- [ ] **Depth Limit Filter**: Batas kedalaman tautan yang akan dirayap (1–5 level)
- [ ] **Path Filter**: Hanya merayap URL yang mengandung pattern tertentu (misal: `/pengaduan/`, `/berita/`)
- [ ] **ORM Model `CrawlJob`**: Tabel baru untuk menyimpan status dan hasil crawling per-situs
- [ ] **ORM Model `CrawledPage`**: Tabel child untuk menyimpan konten setiap halaman yang berhasil dirayap
- [ ] **Inngest Crawling Workflow**: Event-driven crawling menggunakan `step.run()` dengan checkpoint per-halaman
- [ ] **Rate-Limiting & Politeness Mode**: Jeda dinamis antar-request agar tidak membebani server target
- [ ] **Anti-Blocking**: Rotasi User-Agent dan manajemen cookies
- [ ] **Frontend Crawl Tab**: Form untuk memasukkan URL situs dan konfigurasi crawler (depth, filter, delay)
- [ ] **Crawl Progress Viewer**: Visualisasi progres crawling real-time (jumlah halaman ditemukan vs diproses)

---

### E. Discover: Multi-Source Search & Collection

- [ ] **Search Engine Query**: Integrasi Google Search / Google News API untuk pencarian berita berdasarkan keyword
- [ ] **Social Media Search**: Pencarian konten dari platform seperti Twitter/X, Facebook, TikTok, Instagram
- [ ] **Source Configuration UI**: Form untuk mendaftarkan keyword dan sumber yang akan dipantau secara berkala
- [ ] **Scheduled Search (Cron)**: Inngest `TriggerCron` untuk menjalankan pencarian secara otomatis (misal: setiap 6 jam)
- [ ] **Search Results Preview**: Menampilkan hasil pencarian di dashboard sebelum di-ingest ke pipeline
- [ ] **Frontend Search Tab**: Form pencarian keyword dengan filter sumber dan preview hasil

---

### F. Dashboard & Monitoring (UI Enhancements)

- [ ] **Live Action Log / Console**: Widget yang menampilkan proses scraping real-time (`[Playwright] Launching...`, `[Gemini] Extracting...`)
- [ ] **Screenshot Gallery**: Grid preview visual dari semua screenshot yang berhasil diambil
- [ ] **Concurrent Browsers Monitor**: Widget real-time yang menunjukkan jumlah browser headless aktif
- [ ] **Scraped Pages Graph**: Chart garis volume halaman yang berhasil discrape (7 hari terakhir)
- [ ] **Scraping Statistics Cards**: Total halaman discrape, rata-rata waktu per-scrape, success rate
- [ ] **Job Detail Modal**: Klik row di tabel riwayat → buka modal detail dengan result viewer

---

### G. Developer Experience (DX) & Integrations

- [ ] **Get Code Module**: UI di dashboard yang menampilkan snippet integrasi instan (cURL, Python, Node.js)
- [ ] **Model Context Protocol (MCP) Server**: Endpoint `/api/mcp` agar AI Agent bisa memanggil fungsi scraping GovMind secara native
- [ ] **GovMind CLI (`govmind-cli`)**: Tool command-line untuk scraping dari terminal (`govmind-cli scrape URL --format markdown`)
- [ ] **API Key Management untuk Scraper**: Autentikasi API menggunakan key yang bisa di-generate dari dashboard
- [ ] **Webhook Callback**: Notifikasi ke URL eksternal saat scraping selesai (untuk integrasi sistem lain)
- [ ] **Rate Limit & Quota Dashboard**: Monitoring kuota API dan concurrent browsers

---

### H. Data Quality & Governance

- [ ] **Content Validation**: Verifikasi bahwa hasil scraping benar-benar berisi konten (bukan halaman error/captcha)
- [ ] **Language Detection**: Deteksi bahasa konten untuk memastikan hanya konten berbahasa Indonesia yang diproses
- [ ] **PII Redaction**: Otomatis menyensor nomor telepon, email, NIK yang muncul di konten scraping
- [ ] **Duplicate URL Detection**: Mencegah scraping URL yang sama dalam rentang waktu pendek
- [ ] **Content Size Limit**: Batas maksimum ukuran konten yang akan diproses per-halaman

---

## 📊 Ringkasan Prioritas

| Prioritas | Modul | Jumlah Fitur | Alasan |
|-----------|-------|-------------|--------|
| 🔴 Tinggi | A. Data Pipeline (Scrape → Ingest) | 5 | Menghubungkan scraping ke analisis sentimen — core value |
| 🟠 Sedang | B. Extract Lanjutan | 6 | Memperkaya format output yang bisa digunakan |
| 🟠 Sedang | C. Interact (Playwright) | 6 | Mengatasi halaman dinamis (SPA, infinite scroll) |
| 🟡 Normal | D. Crawl | 11 | Perayapan situs OPD secara periodik |
| 🟡 Normal | E. Discover (Search) | 6 | Pencarian isu publik dari berbagai sumber |
| 🔵 Rendah | F. Dashboard Enhancements | 6 | Polish UI dan monitoring |
| 🔵 Rendah | G. Developer Experience | 6 | Integrasi dan ekosistem developer |
| ⚪ Opsional | H. Data Quality | 5 | Governance dan keamanan data |

**Total: ~51 fitur** yang belum dibangun.
