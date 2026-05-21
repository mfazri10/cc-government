"""
Main FastAPI application entry point.
Sesuai backend-patterns.md Section 3:
- Global Exception Handler didaftarkan di sini.
- Router dari berbagai modul di-include di sini.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
)
import inngest.fast_api
from app.inngest_fns.client import inngest_client
from app.inngest_fns.sentiment_functions import all_functions as sentiment_fns
from app.inngest_fns.scraping_functions import scraping_functions as scraping_fns
from app.inngest_fns.crawl_functions import crawl_functions as crawl_fns

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

from app.api.routers import search_router, data_source_router

app.include_router(feedback_router.router, prefix=API_V1_PREFIX)
app.include_router(target_entity_router.router, prefix=API_V1_PREFIX)
app.include_router(analytics_router.router, prefix=API_V1_PREFIX)
app.include_router(auth_router.router, prefix=API_V1_PREFIX)
app.include_router(setting_router.router, prefix=API_V1_PREFIX)
app.include_router(scraper_router.router, prefix=API_V1_PREFIX)
app.include_router(crawler_router.router, prefix=API_V1_PREFIX)
app.include_router(search_router.router, prefix=API_V1_PREFIX)
app.include_router(data_source_router.router, prefix=API_V1_PREFIX)

# ── Mount Inngest Serve ───────────────────────────────────────

inngest.fast_api.serve(
    app,
    inngest_client,
    [*sentiment_fns, *scraping_fns, *crawl_fns],
)


# ── Health Check ───────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "govmind-sentimen-warga"}
