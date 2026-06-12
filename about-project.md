# 🏛️ GOVMIND — City Intelligence Command Center

> Platform multi-agent berbasis AI untuk transformasi tata kelola pemerintah kota — dari perencanaan, evaluasi kinerja, hingga aspirasi warga, semua terintegrasi dalam satu sistem cerdas.

---

## 🎯 Latar Belakang & Relevansi

GOVMIND dirancang khusus untuk menjawab tantangan nyata birokrasi Indonesia, khususnya pemerintah kota/kabupaten seperti Kota Cimahi. Platform ini terinspirasi dari arsitektur SAKIP (Sistem Akuntabilitas Kinerja Instansi Pemerintah) dan dibangun dengan pendekatan **federated multi-agent**:

- **Kota/Kabupaten** bertindak sebagai pusat data (domain agent per OPD)

Setiap OPD memiliki domain agent sendiri (Keuangan, Infrastruktur, Sosial, Hukum) yang dikoordinasikan oleh satu orchestrator agent pusat.

---

## 🩺 5 Pain Point Kronis yang Diselesaikan

| #   | Masalah                                          | Dampat Nyata                                                                                                                 |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | **SAKIP manual & subjektif**                     | Evaluasi bergantung pada interpretasi manusia atas ribuan halaman LAKIP, Renstra, RKA. Hasilnya inkonsisten antar evaluator. |
| 2   | **Regulasi tersebar & tidak bisa dicari**        | Staf perencana sering tidak tahu Perda atau SK mana yang jadi dasar hukum suatu program. "Google-nya" Pemkot tidak ada.      |
| 3   | **Kinerja baru ketahuan meleset di akhir tahun** | Anomali realisasi fisik vs keuangan baru terdeteksi saat Laporan Akhir Tahun. Sudah terlambat untuk intervensi.              |
| 4   | **Laporan makan waktu berminggu-minggu**         | Menulis narasi LAKIP, LKjIP, laporan RPJMD itu pekerjaan besar yang repetitif padahal datanya sudah ada.                     |
| 5   | **Cross-OPD insight tidak pernah muncul**        | Tidak ada sistem yang bisa menjawab: _"Program mana dari 5 dinas yang saling berkonflik target?"_                            |

---

## 🧩 6 Modul Utama GOVMIND

| Modul                  | Fungsi                                                  | Teknologi                 |
| ---------------------- | ------------------------------------------------------- | ------------------------- |
| **SAKIP Evaluator**    | Baca LAKIP + Renstra, evaluasi alignment, prediksi skor | Gemini long-context + RAG |
| **Regulasi RAG**       | Index semua Perda/SK/Perwali, jawab pertanyaan hukum    | Vector DB + RAG           |
| **Kinerja Watchdog**   | Monitor realisasi real-time, deteksi anomali            | Anomaly detection agent   |
| **Laporan Generator**  | Auto-tulis narasi laporan dari data mentah              | Code agent + Writer agent |
| **Cross-OPD Analyst**  | Temukan konflik antar program lintas dinas              | Knowledge graph           |
| **NL Query Interface** | "Tanya apapun" ke semua data pemerintah kota            | NL query agent            |

---

## 🚀 Fitur Hackathon (Phase 1 — Q1)

4 fitur berikut dipilih karena **paling realistis** untuk diimplementasikan dalam jangka hackathon.

---

### 1. 📊 SAKIP Evaluator

**Domain:** Perencanaan | **Estimasi:** 3–4 hari

> Evaluasi otomatis LAKIP vs Renstra, prediksi skor, gap analysis per indikator kinerja.

**Data yang dibutuhkan:**

- LAKIP PDF
- Renstra PDF
- LKjIP
- RKA

**Tech Stack:** `Gemini 1.5 Pro` · `LangChain` · `ChromaDB` · `PyMuPDF`

**Langkah Implementasi:**

1. Ingesti PDF → ekstrak teks per halaman menggunakan PyMuPDF
2. Chunking per bab/indikator → embed dengan Gemini text-embedding-004
3. Index ke ChromaDB dengan metadata: OPD, tahun, jenis dokumen
4. Buat evaluation prompt yang membandingkan target Renstra vs realisasi LAKIP tiap indikator
5. Output formatter: tabel gap analysis + skor prediksi + narasi rekomendasi per indikator

**Contoh Output Demo:**

```
Input: "Evaluasi capaian SAKIP Dinas Kesehatan Cimahi 2023 dan identifikasi risiko target 2024"

Proses (< 60 detik):
→ SAKIP Evaluator agent membaca LAKIP 2023 + Renstra (200+ halaman) via Gemini 1M context
→ Knowledge graph ekstrak semua indikator, target, realisasi
→ Alignment check: Renstra ↔ Renja ↔ RKA ↔ Realisasi
→ Anomaly agent flag: "Indikator stunting target 14%, realisasi 18.3% — RED"
→ Writer agent generate narasi siap masuk dokumen resmi
→ Risk agent prediksi: "3 dari 7 indikator berisiko tidak tercapai 2024"

Output: Laporan analitis + skor prediksi + narasi siap pakai + rekomendasi tindak lanjut
```

> **Demo Value:** Stunting Dinkes Cimahi — target 14%, realisasi 18.3% → **TIDAK TERCAPAI** (gap +4.3pp). Indikator risiko tinggi: 3 dari 7. Rekomendasi: intensifkan intervensi gizi di Kel. Cibabat, Cigugur, Setiamanah.

---

### 2. ⚖️ Regulasi RAG Engine

**Domain:** Regulasi | **Estimasi:** 2–3 hari

> Query bahasa natural ke seluruh Perda, SK, Perwali Cimahi — jawaban dengan kutipan pasal lengkap.

**Data yang dibutuhkan:**

- Perda Cimahi PDF
- SK Walikota
- Perwali
- JDIH Cimahi

**Tech Stack:** `Gemini Embedding API` · `ChromaDB` · `LangChain` · `FastAPI`

**Langkah Implementasi:**

1. Download PDF dari JDIH Cimahi (`jdih.cimahikota.go.id`) secara manual atau scraping
2. Chunk per pasal menggunakan regex split pada pola `"Pasal [0-9]+"`
3. Embed tiap chunk, simpan di ChromaDB dengan metadata: no. perda, tahun, nomor pasal
4. NL query → semantic search → retrieve top-5 chunks paling relevan
5. Gemini generate jawaban: kutipan pasal + penjelasan konteks + referensi lengkap

**Contoh Output Demo:**

```
Tanya: "Dasar hukum pengelolaan PKL di Cimahi?"

Jawab: Berdasarkan Perda No. 3/2018 tentang Penataan PKL, Pasal 8 Ayat 2,
Pemerintah Kota wajib menyediakan lokasi binaan PKL di zona perdagangan
yang telah ditetapkan dalam RDTR.
```

---

### 3. 📢 Pengaduan Intelligence

**Domain:** Warga | **Estimasi:** 2–3 hari

> Agregasi, klasifikasi otomatis, dan routing laporan warga ke OPD yang tepat dengan prioritas urgensi.

**Data yang dibutuhkan:**

- SP4N-LAPOR export CSV
- Data WA pengaduan Cimahi
- Laporan warga format CSV

**Tech Stack:** `Gemini Flash` · `Pandas` · `FastAPI` · `Chart.js`

**Langkah Implementasi:**

1. Ingesti CSV/JSON pengaduan dengan kolom: tanggal, teks laporan, kelurahan pelapor
2. Klasifikasi tiap laporan: topik (infrastruktur/kesehatan/sampah), urgensi (H/M/L), OPD tujuan
3. Clustering pengaduan serupa menggunakan cosine similarity antar embeddings
4. Hotspot detection: kelurahan dengan frekuensi tinggi pada topik yang sama
5. Output: ringkasan bulanan + routing list per OPD + alert hotspot untuk eskalasi

**Contoh Output Demo:**

```
300 pengaduan November 2024:
→ 45% infrastruktur jalan, 23% sampah, 15% air bersih

HOTSPOT: Kel. Melong (47 laporan banjir berulang) → eskalasi DPUPR urgent

Routing: 89 tiket → DPUPR | 68 tiket → DLHK | 45 tiket → PDAM Tirta Raharja
```

---

### 4. 💬 Sentimen Warga (Advanced / Full Scale)

**Domain:** Warga | **Estimasi:** 7–14 hari

> Analisis sentimen publik real-time secara komprehensif dari multi-channel (media sosial, berita lokal, Google Maps, aduan online) menggunakan NLP dan automated data pipelines.

**Data yang dibutuhkan:**

- API X / Twitter (streaming opini publik via keyword kota)
- Scraper Komentar Instagram & Facebook (akun resmi & portal berita lokal)
- Google Maps API (ulasan otomatis seluruh puskesmas, kantor dinas, dan fasilitas kota)
- Berita lokal RSS/Scraping

**Tech Stack:** `Gemini Flash` · `Apache Kafka / RabbitMQ` · `Python Scrapy` · `ChromaDB` · `FastAPI` · `Grafana / React Dashboard`

**Langkah Implementasi:**

1. **Automated Ingestion Pipeline**: Setup cron job dan webhook untuk menarik ratusan ulasan, komentar, dan tweet setiap jam.
2. **Entity & Slang Recognition**: Ekstraksi nama OPD, jalan, atau tokoh spesifik, beserta pemahaman bahasa gaul/lokal (Sunda, singkatan) menggunakan LLM.
3. **Sentiment & Emotion Classification**: Tidak hanya positif/negatif/netral, tapi mendeteksi emosi spesifik (marah, panik, apresiasi).
4. **Predictive Topic Modeling**: Mendeteksi isu yang mulai memanas (trending) sebelum menjadi viral secara nasional (Early Warning System).
5. **Real-time Alerting**: Otomatis mengirimkan push notification/pesan WhatsApp ke tim humas atau OPD terkait jika ada lonjakan tajam (>200%) ulasan negatif dalam 2 jam terakhir.

**Contoh Output Demo:**

```
[🚨 LIVE ALERT: LONJAKAN SENTIMEN NEGATIF]
Topik: Kemacetan parah & lampu merah mati di Simpang Tagog.
Volume: 154 tweet & 45 komentar FB dalam 2 jam terakhir.
Emosi Dominan: Kemarahan (89%).
Rekomendasi Action: Teruskan ke Dishub (Tim Reaksi Cepat) sekarang.

[📊 LAPORAN MINGGUAN DISDUKCAPIL]
Tren Kepuasan: Naik 15% (3.2 → 3.7 dari 5)
Isu Teratas: 
1. Apresiasi: "KTP beres cepat" (120 mention)
2. Keluhan: "AC ruang tunggu rusak" (45 mention) -> ACTION: Eskalasi ke Bagian Umum.
```

---

## 🗺️ Roadmap Pengembangan

### ✅ Phase 1 — Hackathon Scope (Q1)

- [x] SAKIP Evaluator
- [x] Regulasi RAG Engine
- [x] Pengaduan Intelligence
- [x] Sentimen Warga (Lite)

### 🔵 Phase 2 — Pasca Hackathon (1–3 Bulan)

- [ ] Efisiensi Belanja Optimizer
- [ ] Program Sosial Analyzer
- [ ] Konflik Regulasi Detector
- [ ] Cross-OPD Alignment

### 🟣 Phase 3 — Pengembangan Lanjutan (6–12 Bulan)

- [ ] Peta Aspirasi Warga
- [ ] Maintenance Predictor
- [ ] Tata Ruang Compliance

---

## 🏗️ Tumpuan Utama Proyek (Project Pillars)

Berikut adalah **6 tumpuan fundamental** yang harus menjadi landasan seluruh pengembangan GOVMIND:

### 🧠 Pillar 1 — AI-Powered Document Intelligence

**"Dokumen pemerintah harus bisa dibaca dan dianalisis oleh mesin secara akurat."**

- Seluruh arsip PDF (LAKIP, Renstra, Perda, SK) harus bisa diingesti, di-chunking, dan di-embed dengan presisi tinggi
- RAG (Retrieval-Augmented Generation) adalah fondasi jawaban — bukan hallucination
- Metadata dokumen (OPD, tahun, jenis, nomor pasal) adalah kunci relevansi pencarian
- **Tanpa ini:** semua fitur lain tidak bisa berjalan karena data tidak bisa diakses secara semantik

### ⚡ Pillar 2 — Multi-Agent Orchestration

**"Satu pertanyaan bisa membutuhkan banyak agen spesialis yang bekerja bersamaan."**

- Arsitektur federated: orchestrator agent → domain agents (per OPD/fungsi)
- Setiap agent punya scope yang terdefinisi (evaluasi, regulasi, pengaduan, sentimen)
- Agent harus bisa pass context antar satu sama lain tanpa kehilangan informasi
- **Tanpa ini:** sistem hanya bisa menjawab pertanyaan linear, bukan insight lintas domain

### 📊 Pillar 3 — Real-Time Anomaly Detection & Monitoring

**"Masalah harus terdeteksi SEBELUM terlambat, bukan setelah laporan akhir tahun."**

- Monitoring realisasi anggaran vs target secara berkala (bukan tahunan)
- Flag otomatis untuk indikator yang merah atau berisiko tidak tercapai
- Hotspot detection untuk pengaduan warga yang berulang di area yang sama
- **Tanpa ini:** GOVMIND hanya menjadi alat laporan, bukan alat pengambilan keputusan proaktif

### 🏛️ Pillar 4 — Kontekstualisasi Pemerintahan Indonesia

**"AI harus paham konteks regulasi, struktur birokrasi, dan bahasa Indonesia."**

- Model harus mampu memahami istilah teknis SAKIP, RPJMD, Renstra, RKA, LKjIP
- Query dalam Bahasa Indonesia harus menghasilkan jawaban yang relevan secara hukum
- Setiap rekomendasi harus mengacu pada regulasi yang valid dan dapat dikutip (pasal + nomor)
- **Tanpa ini:** sistem akan menghasilkan output yang tidak bisa dipertanggungjawabkan secara hukum

### 🔒 Pillar 5 — Data Governance & Keamanan

**"Data pemerintah adalah aset sensitif — akses harus terstruktur dan terkontrol."**

- Role-based access: data antar OPD tidak boleh bisa diakses sembarangan
- Audit trail untuk setiap query dan output yang dihasilkan sistem
- Pemisahan data publik vs internal pemerintah
- **Tanpa ini:** risiko kebocoran data anggaran dan informasi strategis pemerintah

### 🎯 Pillar 6 — Actionable Output (Bukan Sekadar Laporan)

**"Setiap output harus berujung pada tindakan konkret yang bisa langsung dieksekusi."**

- Setiap analisis harus menghasilkan: **temuan → rekomendasi → routing tindak lanjut**
- Output harus siap pakai: narasi laporan, routing tiket pengaduan, daftar risiko
- Dashboard harus menampilkan "apa yang harus dilakukan hari ini", bukan hanya statistik
- **Tanpa ini:** GOVMIND menjadi sistem yang bagus tapi tidak mengubah perilaku birokrasi

---

## 🛠️ Tech Stack Global

| Layer               | Teknologi                                               |
| ------------------- | ------------------------------------------------------- |
| **LLM / Embedding** | Google Gemini 1.5 Pro, Gemini Flash, text-embedding-004 |
| **RAG Framework**   | LangChain                                               |
| **Vector Database** | ChromaDB                                                |
| **PDF Processing**  | PyMuPDF                                                 |
| **Backend API**     | FastAPI (Python)                                        |
| **Data Processing** | Pandas                                                  |
| **Visualization**   | Chart.js                                                |
| **Frontend**        | Next.js (TypeScript)                                    |

---

## 💡 Nilai Pembeda (Unique Value Proposition)

> GOVMIND bukan sekadar chatbot pemerintah. GOVMIND adalah **system of intelligence** yang:
>
> 1. **Membaca** ribuan halaman dokumen dalam detik
> 2. **Menghubungkan** data lintas OPD yang selama ini tersilo
> 3. **Mendeteksi** masalah sebelum menjadi krisis
> 4. **Menghasilkan** output yang langsung bisa digunakan tanpa editing manual
> 5. **Berjalan** dalam Bahasa Indonesia dengan pemahaman konteks regulasi lokal
