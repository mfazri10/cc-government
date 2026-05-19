# 🏗️ Backend Setup — GOVMIND Sentimen Warga

## Struktur Project

```
backend/
├── .env.example              # Template environment variables
├── .gitignore
├── requirements.txt          # Python dependencies
├── alembic.ini               # Konfigurasi Alembic (migrasi DB)
├── alembic/
│   ├── env.py                # Alembic env (async-aware)
│   ├── script.py.mako        # Template migrasi
│   └── versions/             # File migrasi akan muncul di sini
│
└── app/
    ├── main.py               # ⭐ Entry point FastAPI + Global Exception Handlers
    ├── seed.py               # Seeder data awal (sources, target_entities)
    │
    ├── core/                 # Fondasi aplikasi
    │   ├── config.py         # Settings (pydantic-settings)
    │   ├── database.py       # Async engine + session factory + get_db dependency
    │   ├── models.py         # ORM Models (Source, TargetEntity, RawFeedback, dll)
    │   └── exceptions.py     # Custom exceptions (NotFoundException, dll)
    │
    ├── schemas/              # Pydantic schemas (terpisah dari models/)
    │   ├── feedback.py       # Request/Response schemas untuk feedback & entities
    │   └── analytics.py      # Schemas untuk dashboard data (SentimentSummary, dll)
    │
    ├── services/             # Logika bisnis (agnostik HTTP)
    │   ├── feedback_service.py       # CRUD & query feedback + analytics
    │   └── target_entity_service.py  # CRUD target entities
    │
    ├── api/routers/          # HTTP Layer (hanya terima & teruskan)
    │   ├── feedback_router.py        # POST/GET /feedbacks
    │   ├── target_entity_router.py   # CRUD /target-entities
    │   └── analytics_router.py       # GET /analytics/dashboard, /sentiment-summary
    │
    ├── providers/            # Adapter Pattern (abstraksi AI provider)
    │   ├── base.py           # ABC: BaseSentimentAnalyzer
    │   └── gemini_analyzer.py  # Implementasi Gemini Flash
    │
    └── inngest_fns/          # Background workers (Event-Driven)
        ├── client.py         # Inngest client config
        └── sentiment_functions.py  # Step functions: process & cron
```

## Quick Start

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Buat virtual environment & aktivasi
python -m venv .venv
.venv\Scripts\activate        # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy .env
cp .env.example .env
# → Edit .env, isi DATABASE_URL dan GEMINI_API_KEY

# 5. Seed database (auto-create tables + data awal)
python -m app.seed

# 6. Jalankan server
uvicorn app.main:app --reload --port 8000

# 7. Buka docs
# → http://localhost:8000/docs
```

## API Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/feedbacks/` | Simpan 1 feedback mentah |
| `POST` | `/api/v1/feedbacks/batch` | Bulk insert feedbacks |
| `GET` | `/api/v1/feedbacks/` | List feedback + analisis (paginated) |
| `POST` | `/api/v1/target-entities/` | Buat target entity baru |
| `GET` | `/api/v1/target-entities/` | List semua target entities |
| `GET` | `/api/v1/target-entities/{id}` | Detail target entity |
| `PATCH` | `/api/v1/target-entities/{id}` | Update target entity |
| `DELETE` | `/api/v1/target-entities/{id}` | Hapus target entity |
| `GET` | `/api/v1/analytics/dashboard` | Overview dashboard |
| `GET` | `/api/v1/analytics/sentiment-summary` | Pie chart data |
| `GET` | `/api/v1/analytics/top-issues` | Bar chart data |

## Pattern yang Diterapkan

Sesuai `backend-patterns.md`:

1. ✅ **Layered Architecture** — Router → Service → Models (terpisah ketat)
2. ✅ **Dependency Injection** — `get_db` via `Depends()`
3. ✅ **Centralized Exception Handling** — Custom exceptions + Global handlers
4. ✅ **Adapter Pattern** — `BaseSentimentAnalyzer` → `GeminiSentimentAnalyzer`
5. ✅ **Event-Driven Inngest** — `step.run()` checkpoints, idempotent functions
6. ✅ **Style Guide** — snake_case, PascalCase, type hints, Pydantic terpisah
