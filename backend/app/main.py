"""
Main FastAPI application entry point.
Sesuai backend-patterns.md Section 3:
- Global Exception Handler didaftarkan di sini.
- Router dari berbagai modul di-include di sini.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import google.generativeai as genai
import asyncio
from app.core.database import get_db
from app.core.models import SystemSetting

from app.core.config import get_settings
from app.core.exceptions import (
    AppException,
    DuplicateEntryException,
    ExternalServiceException,
    NotFoundException,
    ValidationException,
    UnauthorizedException,
    ForbiddenException,
)

from app.api.routers import (
    feedback_router,
    target_entity_router,
    analytics_router,
    auth_router,
    setting_router,
    scraper_router,
    crawler_router,
    export_router,
)
import inngest.fast_api
from app.inngest_fns.client import inngest_client
from app.inngest_fns.sentiment_functions import all_functions as sentiment_fns
from app.inngest_fns.scraping_functions import scraping_functions as scraping_fns
from app.inngest_fns.crawl_functions import crawl_functions as crawl_fns
from app.inngest_fns.data_source_functions import all_functions as datasource_fns
from app.inngest_fns.social_sync_functions import social_sync_functions as social_fns

settings = get_settings()


# ── Lifespan (startup/shutdown) ────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("GOVMIND Sentimen Warga API starting...")
    yield
    # Shutdown
    print("GOVMIND Sentimen Warga API shutting down...")


# ── App Instance ───────────────────────────────────────────────

app = FastAPI(
    title="GOVMIND — Sentimen Warga API",
    description="API untuk modul Sentimen Warga: ingesti, analisis AI, dan dashboard opini publik.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Exception Handlers (backend-patterns.md Section 3) ─

@app.exception_handler(NotFoundException)
async def not_found_handler(request: Request, exc: NotFoundException):
    return JSONResponse(
        status_code=404,
        content={"error": "Not Found", "message": exc.message},
    )


@app.exception_handler(DuplicateEntryException)
async def duplicate_handler(request: Request, exc: DuplicateEntryException):
    return JSONResponse(
        status_code=409,
        content={"error": "Conflict", "message": exc.message},
    )


@app.exception_handler(ValidationException)
async def validation_handler(request: Request, exc: ValidationException):
    return JSONResponse(
        status_code=422,
        content={"error": "Validation Error", "message": exc.message},
    )


@app.exception_handler(ExternalServiceException)
async def external_service_handler(request: Request, exc: ExternalServiceException):
    return JSONResponse(
        status_code=502,
        content={"error": "Bad Gateway", "message": exc.message},
    )


@app.exception_handler(UnauthorizedException)
async def unauthorized_handler(request: Request, exc: UnauthorizedException):
    return JSONResponse(
        status_code=401,
        content={"error": "Unauthorized", "message": exc.message},
    )


@app.exception_handler(ForbiddenException)
async def forbidden_handler(request: Request, exc: ForbiddenException):
    return JSONResponse(
        status_code=403,
        content={"error": "Forbidden", "message": exc.message},
    )


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "message": exc.message},
    )


# ── Register Routers ──────────────────────────────────────────

API_V1_PREFIX = "/api/v1"

from app.api.routers import search_router, data_source_router, social_router

app.include_router(feedback_router.router, prefix=API_V1_PREFIX)
app.include_router(target_entity_router.router, prefix=API_V1_PREFIX)
app.include_router(analytics_router.router, prefix=API_V1_PREFIX)
app.include_router(auth_router.router, prefix=API_V1_PREFIX)
app.include_router(setting_router.router, prefix=API_V1_PREFIX)
app.include_router(scraper_router.router, prefix=API_V1_PREFIX)
app.include_router(crawler_router.router, prefix=API_V1_PREFIX)
app.include_router(search_router.router, prefix=API_V1_PREFIX)
app.include_router(data_source_router.router, prefix=API_V1_PREFIX)
app.include_router(social_router.router, prefix=API_V1_PREFIX)
app.include_router(export_router.router, prefix=API_V1_PREFIX)

# ── Mount Inngest Serve ───────────────────────────────────────

inngest.fast_api.serve(
    app,
    inngest_client,
    [*sentiment_fns, *scraping_fns, *crawl_fns, *datasource_fns, *social_fns],
)


# ── Health Check ───────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check(db: AsyncSession = Depends(get_db)):
    # Check Database connection
    db_status = "connected"
    try:
        await db.execute(select(1))
    except Exception as e:
        db_status = f"failed: {str(e)}"

    # Check Gemini connection
    gemini_status = "not_configured"
    gemini_error = None
    try:
        # Get dynamic API Key
        result = await db.execute(
            select(SystemSetting).where(SystemSetting.key == "GEMINI_API_KEY")
        )
        setting = result.scalar_one_or_none()
        api_key = setting.value.strip() if (setting and setting.value.strip()) else settings.GEMINI_API_KEY

        if api_key:
            # Configure and test
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            try:
                # Set timeout 4 detik
                response = await asyncio.wait_for(
                    model.generate_content_async("Ping"),
                    timeout=4.0
                )
                if response and response.text:
                    gemini_status = "connected"
                else:
                    gemini_status = "empty_response"
            except asyncio.TimeoutError:
                gemini_status = "timeout"
                gemini_error = "Koneksi ke Gemini timed out setelah 4 detik."
            except Exception as ex:
                gemini_status = "failed"
                gemini_error = str(ex)
        else:
            gemini_status = "missing_api_key"
    except Exception as e:
        gemini_status = "error_retrieving_key"
        gemini_error = str(e)

    health_response = {
        "status": "ok" if db_status == "connected" and gemini_status == "connected" else "degraded",
        "service": "govmind-sentimen-warga",
        "dependencies": {
            "database": db_status,
            "gemini": {
                "status": gemini_status,
                **( {"error": gemini_error} if gemini_error else {} )
            }
        }
    }
    return health_response
