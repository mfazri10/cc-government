# GOVMIND - Environment Configuration

## Backend (.env)
Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database
DATABASE_URL=postgresql+asyncpg://govmind:govmind_secret@localhost:5432/govmind

# AI/LLM
GEMINI_API_KEY=your_gemini_api_key_here

# Inngest (Background Jobs)
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Alerts (Optional)
ALERT_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ALERT_TELEGRAM_CHAT_ID=your_telegram_chat_id
ALERT_WEBHOOK_URL=your_webhook_url
ALERT_EMAIL=your_email@example.com

# Search (Optional)
SERPER_API_KEY=your_serper_api_key
```

## Frontend (.env.local)
Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Docker
For Docker deployment, use environment variables in `docker-compose.yml`:

```yaml
environment:
  DATABASE_URL: postgresql+asyncpg://govmind:govmind_secret@postgres:5432/govmind
  GEMINI_API_KEY: ${GEMINI_API_KEY}
  INNGEST_EVENT_KEY: ${INNGEST_EVENT_KEY}
  INNGEST_SIGNING_KEY: ${INNGEST_SIGNING_KEY}
```

## Running the Application

### Without Docker
1. Start PostgreSQL database
2. Run backend: `cd backend && uvicorn app.main:app --reload`
3. Run frontend: `cd frontend && pnpm dev`

### With Docker
```bash
docker-compose up -d
```

### Running Tests
```bash
cd backend && pytest
```
