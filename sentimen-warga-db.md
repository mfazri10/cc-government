# 🗄️ Perancangan Database: Sentimen Warga

Untuk mengakomodasi alur data dari _raw scraping_ hingga analisis AI, kita membutuhkan kombinasi **PostgreSQL** (untuk data relasional & dashboard) dan **ChromaDB** (untuk pencarian semantik & clustering topik).

Berikut adalah rancangan struktur *database*-nya.

---

## 1. Relational Database (PostgreSQL)

Struktur ini dirancang agar setiap _feedback_ mentah (dari scraper) tersimpan dengan aman, lalu diproses secara asinkron oleh **Inngest**, dan hasil analisis LLM-nya disimpan di tabel terpisah.

### A. Tabel Referensi / Master
Tabel ini digunakan untuk mengatur sumber data dan siapa yang akan dipantau (OPD/Fasilitas).

**`sources`** (Sumber Data)
- `id` (INT, PK): 1, 2, 3
- `name` (VARCHAR): 'Google Maps', 'Twitter', 'Instagram'
- `type` (VARCHAR): 'review', 'social_media'

**`target_entities`** (OPD / Fasilitas Publik / Target Pantauan)
- `id` (INT, PK)
- `name` (VARCHAR): 'RSUD Cibabat', 'Disdukcapil'
- `entity_type` (VARCHAR): 'OPD', 'Fasilitas_Kesehatan', 'Tokoh'
- `keywords` (TEXT[]): `['rsud cibabat', 'rs cibabat']` (Kata kunci untuk scraping Twitter)
- `pic_contact` (VARCHAR): `+62812345...` atau `chat_id` Telegram (Untuk _routing_ notifikasi EWS)

### B. Tabel Transaksional (Alur Data)

**`raw_feedbacks`** (Data Mentah Hasil Scraping)
Menyimpan semua data masuk sebelum diproses Gemini.
- `id` (UUID, PK)
- `source_id` (INT, FK -> sources)
- `target_entity_id` (INT, FK -> target_entities, nullable)
- `original_post_id` (VARCHAR): ID asli dari platform (agar tidak _duplicate_)
- `author_name` (VARCHAR): Nama akun warga
- `content` (TEXT): Isi ulasan/tweet/komentar mentah
- `url` (VARCHAR): Link asli menuju post tersebut
- `posted_at` (TIMESTAMP): Waktu warga memposting
- `scraped_at` (TIMESTAMP): Waktu sistem menarik data
- `is_processed` (BOOLEAN): `FALSE` (Akan diubah `TRUE` setelah Inngest + LLM selesai)

**`analyzed_feedbacks`** (Hasil Analisis AI / Gemini)
Relasi 1-to-1 dengan `raw_feedbacks`. Dipisahkan agar jika logic LLM berubah, kita bisa melakukan re-analisis data mentah.
- `feedback_id` (UUID, PK/FK -> raw_feedbacks.id)
- `sentiment` (VARCHAR): `'POSITIVE'`, `'NEGATIVE'`, `'NEUTRAL'`
- `emotion` (VARCHAR): `'Marah'`, `'Panik'`, `'Apresiasi'`, `'Sedih'`, `'Harapan'`
- `topics` (TEXT[]): `['Antrian', 'AC Rusak', 'Petugas Kasar']` (Diekstrak otomatis oleh LLM)
- `summary` (TEXT): Ringkasan singkat jika `content` asli terlalu panjang (>200 kata)
- `needs_attention` (BOOLEAN): `TRUE` jika LLM mendeteksi urgensi tinggi (misal: "Banjir parah tolong!", "Pasien pendarahan tidak ditangani")
- `analyzed_at` (TIMESTAMP)

**`alerts_log`** (Catatan Sistem Peringatan Dini / EWS)
Merekam semua notifikasi yang pernah dikirim ke PIC OPD.
- `id` (UUID, PK)
- `target_entity_id` (INT, FK -> target_entities)
- `trigger_reason` (TEXT): Contoh: "Lonjakan 250% sentimen negatif pada topik 'Pungli' dalam 3 jam terakhir"
- `status` (VARCHAR): `'SENT'`, `'FAILED'`, `'DELIVERED'`
- `sent_at` (TIMESTAMP)

---

## 2. Vector Database (ChromaDB)

ChromaDB tidak menggantikan PostgreSQL, melainkan digunakan sebagai pendamping untuk melakukan **Semantic Search** dan **Topic Clustering**.

**Collection Name:** `feedback_embeddings`

**Struktur Dokumen di ChromaDB:**
- **Document (Teks yang di-embed):** Kombinasi dari `content` asli dan `summary` dari hasil analisis.
- **Embedding:** Dihasilkan menggunakan `Google text-embedding-004` (atau model embedding lokal).
- **Metadata:**
  ```json
  {
    "feedback_id": "uuid-dari-postgres",
    "target_entity": "Disdukcapil",
    "sentiment": "NEGATIVE",
    "topics": "Antrian, Pelayanan",
    "posted_at": "2024-11-20T10:00:00Z"
  }
  ```

### Kasus Penggunaan (Use Cases) ChromaDB:
1. **Analisis Isu Serupa (Clustering):**
   Jika Inngest memproses keluhan *"Jalan depan pasar antri macet parah"*, ChromaDB akan mencari apakah ada keluhan serupa di lokasi itu minggu ini. Jika tembus *threshold* jumlah (misal >20 keluhan semantik mirip), sistem akan men-trigger tabel `alerts_log`.
2. **Pencarian Bahasa Natural (NL Query):**
   Memungkinkan pimpinan (Walikota/Kadis) bertanya di UI: *"Tolong carikan semua keluhan warga soal jalan berlubang di bulan ini"*.

---

## 🔄 3. Alur Kerja Database dengan Inngest

1. **Scraping Job (Inngest Cron):** Skrip berjalan tiap 1 jam, menyimpan data ke `raw_feedbacks` (dengan `is_processed = FALSE`).
2. **Analysis Job (Inngest Event):** 
   - Tiap ada baris baru di `raw_feedbacks`, event di-trigger.
   - Worker mengirim `content` ke **Gemini Flash**.
   - Hasil kembalian Gemini disimpan ke `analyzed_feedbacks`.
   - Update `raw_feedbacks.is_processed = TRUE`.
3. **Embedding Job (Inngest Step):** Teks hasil analisis dikirim ke model Embedding, lalu di-_upsert_ ke **ChromaDB**.
4. **Anomaly Detection Job:** _Query_ rutin ke Postgres & ChromaDB. Jika _count(sentiment=NEGATIVE)_ pada suatu OPD melonjak > batas wajar, jalankan fungsi kirim Telegram/WA, lalu catat di `alerts_log`.
