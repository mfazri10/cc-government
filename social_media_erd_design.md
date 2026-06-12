# 📊 Desain ERD & Skema Basis Data — Fitur Scraping Media Sosial

Dokumen ini merancang **Entity Relationship Diagram (ERD)** dan skema tabel database PostgreSQL untuk fitur scraping media sosial (Instagram, TikTok, Facebook, Twitter/X) berbasis username. Fitur ini dirancang agar terintegrasi penuh dengan pipeline analitik sentimen **GOVMIND** yang sudah ada, dengan mempertimbangkan aspek keamanan, skalabilitas, dan ketahanan terhadap pemblokiran.

---

## 📐 Entity Relationship Diagram (ERD)

Berikut adalah visualisasi hubungan antara tabel lama (Legacy Tables) dengan tabel baru (termasuk pool proxy dan logging performa) yang akan kita bangun untuk modul pemantauan media sosial:

```mermaid
erDiagram
    %% Legacy Tables
    target_entities {
        int id PK
        string name
        string entity_type
        array keywords
        string pic_contact
        datetime created_at
    }

    sources {
        int id PK
        string name
        string type
    }

    raw_feedbacks {
        uuid id PK
        int source_id FK
        int target_entity_id FK
        string original_post_id UK
        string author_name
        text content
        string url
        datetime posted_at
        datetime scraped_at
        boolean is_processed
    }

    analyzed_feedbacks {
        uuid feedback_id PK, FK
        string sentiment
        string emotion
        array topics
        text summary
        boolean needs_attention
        datetime analyzed_at
    }

    %% New Tables
    social_monitors {
        uuid id PK
        string platform
        string username
        int target_entity_id FK
        boolean is_active
        int scrape_interval_hours
        int max_posts_per_run
        string last_cursor
        int consecutive_failures
        jsonb config
        datetime last_scraped_at
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }

    social_accounts {
        uuid id PK
        string platform
        string username
        jsonb cookies_encrypted
        string status
        string proxy_url
        datetime last_used_at
        datetime updated_at
    }

    social_proxies {
        uuid id PK
        string proxy_url UK
        string protocol
        string status
        int failure_count
        datetime last_checked_at
        datetime created_at
    }

    social_scrape_logs {
        uuid id PK
        uuid social_monitor_id FK
        uuid social_account_id FK
        uuid proxy_id FK
        string status
        int items_scraped
        int duration_ms
        int retry_count
        text error_message
        datetime scraped_at
    }

    %% Relationships
    target_entities ||--o{ raw_feedbacks : "has"
    sources ||--o{ raw_feedbacks : "has"
    raw_feedbacks ||--|| analyzed_feedbacks : "has_analysis"

    target_entities ||--o{ social_monitors : "monitors"
    social_monitors ||--o{ social_scrape_logs : "generates"
    social_accounts ||--o{ social_scrape_logs : "processes"
    social_proxies ||--o{ social_scrape_logs : "uses"
```

---

## 🗄️ Detail Skema Tabel Baru

### 1. Tabel `social_monitors`
Digunakan untuk mendaftarkan akun target yang dipantau secara berkala (misal: akun IG dinas, TikTok walikota, portal berita lokal).

*   **Nama Tabel**: `social_monitors`
*   **Constraints**: `UNIQUE (platform, username)`
*   **Kolom**:
    | Nama Kolom | Tipe Data | Constraint | Keterangan |
    | :--- | :--- | :--- | :--- |
    | `id` | `UUID` | PK, Default `gen_random_uuid()` | ID unik monitor |
    | `platform` | `VARCHAR(50)` | Not Null | `instagram`, `tiktok`, `facebook`, `twitter` |
    | `username` | `VARCHAR(255)` | Not Null | Username target (tanpa karakter `@`) |
    | `target_entity_id` | `INT` | FK → `target_entities(id)` | Terhubung dengan OPD tujuan analisis |
    | `is_active` | `BOOLEAN` | Default `TRUE` | Status aktif/tidaknya sinkronisasi otomatis |
    | `scrape_interval_hours`| `INT` | Default `24` | Frekuensi scraping per monitor |
    | `max_posts_per_run` | `INT` | Default `10` | Batas postingan per eksekusi untuk cegah overload |
    | `last_cursor` | `VARCHAR(500)` | Nullable | ID/Timestamp postingan terakhir (incremental scraping) |
    | `consecutive_failures`| `INT` | Default `0` | Jumlah kegagalan berturut-turut untuk auto-deactivate |
    | `config` | `JSONB` | Nullable | Pengaturan kustom (misal: filter keyword, kedalaman komentar) |
    | `last_scraped_at` | `TIMESTAMP WITH TIME ZONE`| Nullable | Tanggal terakhir sinkronisasi berhasil |
    | `created_at` | `TIMESTAMP WITH TIME ZONE`| Default `NOW()` | Tanggal dibuat |
    | `updated_at` | `TIMESTAMP WITH TIME ZONE`| Default `NOW()`, Auto-update | Tanggal diperbarui |
    | `deleted_at` | `TIMESTAMP WITH TIME ZONE`| Nullable | Soft delete (untuk menjaga riwayat log tetap valid) |

---

### 2. Tabel `social_accounts`
Menyimpan akun dummy (*scraper accounts*) dan kuki sesi terenkripsi untuk melewati dinding login media sosial target.

*   **Nama Tabel**: `social_accounts`
*   **Constraints**: `UNIQUE (platform, username)`
*   **Kolom**:
    | Nama Kolom | Tipe Data | Constraint | Keterangan |
    | :--- | :--- | :--- | :--- |
    | `id` | `UUID` | PK, Default `gen_random_uuid()` | ID unik akun |
    | `platform` | `VARCHAR(50)` | Not Null | `instagram`, `tiktok`, `facebook`, `twitter` |
    | `username` | `VARCHAR(255)` | Not Null | Username akun dummy |
    | `cookies_encrypted` | `JSONB` | Not Null | Kuki sesi ter-serialize yang telah dienkripsi (AES-256) |
    | `status` | `VARCHAR(50)` | Default `'VALID'` | `'VALID'`, `'EXPIRED'`, `'BLOCKED'` (untuk rotasi otomatis) |
    | `proxy_url` | `VARCHAR(500)` | Nullable | Proxy spesifik yang dipasangkan ke akun ini (jika ada) |
    | `last_used_at` | `TIMESTAMP WITH TIME ZONE`| Nullable | Terakhir digunakan untuk crawling |
    | `updated_at` | `TIMESTAMP WITH TIME ZONE`| Default `NOW()`, Auto-update | Kapan kuki terakhir kali di-refresh |

---

### 3. Tabel `social_proxies`
Pool proxy perumahan/data center untuk mencegah pemblokiran IP oleh firewall media sosial.

*   **Nama Tabel**: `social_proxies`
*   **Kolom**:
    | Nama Kolom | Tipe Data | Constraint | Keterangan |
    | :--- | :--- | :--- | :--- |
    | `id` | `UUID` | PK, Default `gen_random_uuid()` | ID unik proxy |
    | `proxy_url` | `VARCHAR(500)` | Not Null, Unique | Format: `http://user:pass@host:port` |
    | `protocol` | `VARCHAR(10)` | Not Null | `'http'`, `'socks5'` |
    | `status` | `VARCHAR(50)` | Default `'ACTIVE'` | `'ACTIVE'`, `'SLOW'`, `'BLOCKED'` |
    | `failure_count` | `INT` | Default `0` | Jumlah kegagalan koneksi berturut-turut |
    | `last_checked_at` | `TIMESTAMP WITH TIME ZONE`| Nullable | Pemeriksaan kesehatan terakhir |
    | `created_at` | `TIMESTAMP WITH TIME ZONE`| Default `NOW()` | Waktu ditambahkan |

---

### 4. Tabel `social_scrape_logs`
Mencatat metrik kinerja, durasi eksekusi, penggunaan proxy, dan alasan error jika terjadi kegagalan.

*   **Nama Tabel**: `social_scrape_logs`
*   **Kolom**:
    | Nama Kolom | Tipe Data | Constraint | Keterangan |
    | :--- | :--- | :--- | :--- |
    | `id` | `UUID` | PK, Default `gen_random_uuid()` | ID log unik |
    | `social_monitor_id` | `UUID` | FK → `social_monitors(id)` ON DELETE RESTRICT | Monitor yang sedang berjalan |
    | `social_account_id` | `UUID` | FK → `social_accounts(id)` ON DELETE SET NULL, Nullable | Akun dummy yang memproses |
    | `proxy_id` | `UUID` | FK → `social_proxies(id)` ON DELETE SET NULL, Nullable | Proxy yang digunakan saat eksekusi |
    | `status` | `VARCHAR(50)` | Not Null | `'SUCCESS'`, `'FAILED'` |
    | `items_scraped` | `INT` | Default `0` | Jumlah komentar/postingan baru yang berhasil ditarik |
    | `duration_ms` | `INT` | Not Null | Durasi total scraping (dalam milidetik) |
    | `retry_count` | `INT` | Default `0` | Jumlah upaya percobaan ulang saat terjadi error minor |
    | `error_message` | `TEXT` | Nullable | Detail pesan error jika status `'FAILED'` |
    | `scraped_at` | `TIMESTAMP WITH TIME ZONE`| Default `NOW()` | Waktu eksekusi scraping |

---

## ⚡ Definisi Index Database (Krusial untuk Skalabilitas)

Index di bawah ini sangat penting untuk memastikan query agregasi performa tinggi saat data bertambah besar:

```sql
-- Query scheduler untuk mencari monitor aktif dan siap sinkronisasi
CREATE INDEX idx_social_monitors_active 
ON social_monitors (platform, is_active) 
WHERE deleted_at IS NULL;

-- Pengurutan waktu scraping untuk efisiensi sinkronisasi
CREATE INDEX idx_social_monitors_last_scraped 
ON social_monitors (last_scraped_at);

-- Rotasi akun dummy per platform secara cepat
CREATE INDEX idx_social_accounts_status 
ON social_accounts (platform, status, last_used_at);

-- Pencarian log audit untuk visualisasi performa di dasbor
CREATE INDEX idx_social_scrape_logs_monitor 
ON social_scrape_logs (social_monitor_id, scraped_at DESC);

-- Menjamin tidak ada duplikasi input ke tabel raw_feedbacks
CREATE UNIQUE INDEX idx_raw_feedbacks_dedup 
ON raw_feedbacks (original_post_id);
```

---

## 🔄 Pembaruan Alur Aliran Data (Incremental Data Flow)

```
        [ Inngest Scheduler Trigger ]
                      │
                      ▼
        [ 1. Select Active Monitors ]
       (Filter: is_active=True & time)
                      │
                      ▼
        [ 2. Resource Allocation ]
  (Select Valid Account & Proxy from Pool)
                      │
                      ▼
        [ 3. Incremental Scrape ]
    (Read last_cursor -> Fetch new items)
                      │
        ┌─────────────┴─────────────┐
     SUCCESS                      FAILED
        │                           │
        ▼                           ▼
[ Reset consecutive_failures ]  [ Increment consecutive_failures ]
[ Update last_cursor ]          [ If failures >= 5, set is_active=False ]
[ Log: SUCCESS & duration ]     [ Check failure type (Proxy/Account) ]
[ Ingest to raw_feedbacks ]     [ Block Proxy / Rotate Account ]
[ Trigger Sentiment Pipeline ]  [ Log: FAILED & error_message ]
```

1.  **Trigger**: Background job (Inngest) mengambil daftar `social_monitors` yang `is_active = TRUE`, `deleted_at IS NULL`, dan masa tunggunya sudah melewati `scrape_interval_hours`.
2.  **Resource Allocation**: Sistem mencocokkan platform dengan akun dummy dari `social_accounts` yang berstatus `'VALID'` dan memilih proxy aktif dari `social_proxies` secara acak (*random rotation*).
3.  **Incremental Extraction**: Scrapling (Playwright/Stealth) mengekstrak postingan & komentar terbaru mulai dari `last_cursor` untuk menghindari pengambilan ulang data lama.
4.  **Error Handling & Health Checks**:
    *   Jika **sukses**: Nilai `last_cursor` diperbarui, `consecutive_failures` di-reset ke `0`, dan log performa dicatat.
    *   Jika **gagal**:
        *   `consecutive_failures` ditambah `1`. Jika kegagalan beruntun mencapai `5` kali, status `is_active` diubah otomatis menjadi `FALSE` agar tidak terus membebani sistem.
        *   Sistem menganalisis jenis error. Jika terjadi *Network Timeout / Connection Blocked*, proxy terkait diubah menjadi `'BLOCKED'`. Jika terjadi *Credential Error*, akun dummy diubah menjadi `'EXPIRED'` atau `'BLOCKED'`.
5.  **Ingestion & Analisis**: Ulasan/komentar baru disimpan ke `raw_feedbacks` dengan hash `original_post_id` untuk jaminan deduplikasi di level database. Setelahnya, analisis sentimen (Gemini) langsung dipicu.
