# 💬 Spesifikasi Fitur: Sentimen Warga (Advanced / Full Scale)

## 📌 1. Gambaran Umum (Overview)

Fitur **Sentimen Warga** adalah sistem pemantauan opini publik _real-time_ berskala penuh. Sistem ini dirancang untuk mendengarkan, menganalisis, dan memetakan keluhan, apresiasi, serta tren isu di masyarakat Kota Cimahi (atau kota lain) dari berbagai sumber digital.

Tujuan utamanya bukan sekadar menampilkan dashboard sentimen, melainkan berfungsi sebagai **Early Warning System (EWS)** yang secara proaktif memperingatkan pemerintah/OPD sebelum sebuah isu meledak menjadi krisis viral.

---

## 🎯 2. Scope of Work (Ruang Lingkup)

Pengembangan fitur ini dibagi ke dalam 4 pilar fungsional utama:

### A. Automated Ingestion Pipeline (Pengumpulan Data)

- Integrasi otomatis ke berbagai channel digital publik.
- Sistem _scheduler_ (cron jobs/message queue) untuk menarik data terbaru setiap jam/hari.
- Pembersihan data awal (menghapus spam, bot, duplikasi).

### B. NLP & Cognitive Engine (Pemrosesan Bahasa)

- **Sentiment & Emotion Classification:** Membagi ulasan ke dalam _sentiment_ (Positif, Negatif, Netral) dan mengekstrak emosi dominan (Marah, Panik, Sedih, Apresiasi).
- **Local Context & Slang Recognition:** Kemampuan AI (Gemini Flash) untuk membedah bahasa lokal (Sunda), singkatan warga, dan bahasa gaul.
- **Entity Extraction:** Otomatis mendeteksi instansi (Disdukcapil, RSUD, Satpol PP), lokasi (Nama jalan, kelurahan), atau nama tokoh (Walikota, Kepala Dinas).

### C. Predictive Topic Modeling

- Melakukan klastering terhadap topik-topik keluhan yang sedang bermunculan.
- Mendeteksi lonjakan anomali ulasan negatif pada topik tertentu dalam rentang waktu singkat (misal: "macet", "banjir", "pelayanan lambat").

### D. Alerting & Reporting (Notifikasi & Laporan)

- **Dashboard Real-time:** Visualisasi sentimen harian, isu teratas, dan OPD dengan sentimen terendah.
- **Real-time Alerting:** Mengirimkan _push notification_ atau pesan otomatis via WhatsApp/Telegram ke PIC OPD jika terjadi lonjakan sentimen negatif ekstrem (>200% dalam 2 jam).
- **Auto-generated Report:** Laporan otomatis mingguan/bulanan per OPD.

---

## 📡 3. Sumber Data yang Dibutuhkan

Sistem akan memantau kanal-kanal berikut:

1. **Media Sosial (X / Twitter):** Streaming keyword/hashtag seputar Kota Cimahi, Pemkot Cimahi, Walikota, dll.
2. **Google Maps Reviews:** Menarik ulasan terbaru dari titik-titik layanan publik (Puskesmas, RSUD, Kantor Kecamatan/Kelurahan, Disdukcapil).
3. **Instagram & Facebook (Akun Resmi & Portal Lokal):** Scraping komentar dari postingan IG Pemkot, IG Walikota, atau portal berita lokal (Cimahi Info, dll).
4. **Portal Pengaduan Online / Berita Lokal:** (Opsional) RSS Feed dari berita lokal untuk sinkronisasi topik yang sedang diangkat media.

---

## 🏗️ 4. Arsitektur Teknis & Tech Stack

Sistem akan berjalan dengan arsitektur data pipeline sebagai berikut:

`Data Sources` ➔ `Ingestion (Scraping/API)` ➔ `Message Queue` ➔ `Processing Worker (LLM)` ➔ `Database` ➔ `Dashboard & Alerting`

**Tech Stack yang direkomendasikan:**

- **Data Ingestion:** Python ([Scrapling](https://github.com/D4Vinci/Scrapling) untuk web scraping canggih dan anti-bot bypass, Tweepy/API untuk Twitter)
- **Message Broker / Queue / Job Orchestrator:** Inngest (untuk orchestrasi _background jobs_, antrian scraping, dan NLP processing agar server tidak _blocking_)
- **AI / LLM Engine:** Google Gemini Flash (cepat dan hemat token untuk batch processing) + LangChain
- **Database:** PostgreSQL (data relasional), ChromaDB (vector search topik), Redis (caching).
- **Backend API:** FastAPI (Python)
- **Frontend / Dashboard:** Next.js (TypeScript) + React (Tailwind CSS) + Chart.js / Recharts.
- **Alerting:** Integrasi API Telegram Bot.

---

## 📋 5. Persyaratan (Requirements) & Hal yang Harus Disiapkan

Untuk memulai pengembangan, kita membutuhkan prasyarat berikut:

**1. Kredensial & API Keys:**

- Google Gemini API Key (Untuk analisis NLP sentimen & entitas).
- API Key Google Maps / Places API (Untuk scraping review lokasi).
- Akses ke Twitter/X Developer API (atau tools OSINT seperti Twint/Snscrape jika API berbayar).
- Token API Telegram Bot (untuk testing fitur Alert).

**2. Infrastruktur:**

- Server lokal/Cloud dengan memori cukup untuk menjalankan _worker_ background (Inngest).

**3. Dataset Awal (Cold Start):**

- Daftar ID Google Maps (Place ID) untuk 10-20 fasilitas publik utama di Cimahi.
- Daftar keyword, hashtag, dan akun media sosial yang menjadi target pantauan.

---

## 🚀 Langkah Selanjutnya (Next Steps)

1. Menyiapkan repository _backend_ Python (FastAPI & Inngest).
2. Membangun skrip _Scraper/Ingestion_ pertama (mulai dari Google Maps API yang paling terstruktur).
3. Membuat prompt _engineering_ untuk analisis sentimen dengan Gemini Flash.
4. Menyiapkan database untuk menyimpan hasil analisis.
