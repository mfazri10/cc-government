"""
Router Layer: Social Media Monitoring & Scraping Endpoints.
"""

from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.schemas.social import (
    SocialMonitorCreate,
    SocialMonitorUpdate,
    SocialMonitorResponse,
    SocialAccountCreate,
    SocialAccountUpdate,
    SocialAccountResponse,
    SocialProxyCreate,
    SocialProxyUpdate,
    SocialProxyResponse,
    SocialScrapeLogResponse,
)
from app.services.social_scrape_service import social_scrape_service

router = APIRouter(prefix="/social", tags=["Social Media Scraping"])

# ── Monitors ───────────────────────────────────────────────────

@router.post("/monitors", response_model=SocialMonitorResponse, status_code=201)
async def create_monitor(
    req: SocialMonitorCreate,
    db: AsyncSession = Depends(get_db),
):
    """Membuat target pemantauan media sosial baru (username & platform)."""
    return await social_scrape_service.create_monitor(db, req)


@router.get("/monitors", response_model=List[SocialMonitorResponse])
async def list_monitors(
    platform: Optional[str] = Query(None, description="Filter berdasarkan platform"),
    is_active: Optional[bool] = Query(None, description="Filter berdasarkan status aktif"),
    db: AsyncSession = Depends(get_db),
):
    """Mendaftar target pemantauan media sosial."""
    return await social_scrape_service.list_monitors(db, platform=platform, is_active=is_active)


@router.get("/monitors/{monitor_id}", response_model=SocialMonitorResponse)
async def get_monitor(
    monitor_id: UUID = Path(..., description="ID Monitor"),
    db: AsyncSession = Depends(get_db),
):
    """Mendapatkan detail target pemantauan media sosial."""
    return await social_scrape_service.get_monitor(db, monitor_id)


@router.patch("/monitors/{monitor_id}", response_model=SocialMonitorResponse)
async def update_monitor(
    monitor_id: UUID = Path(..., description="ID Monitor"),
    req: SocialMonitorUpdate = ...,
    db: AsyncSession = Depends(get_db),
):
    """Memperbarui pengaturan pemantauan media sosial."""
    return await social_scrape_service.update_monitor(db, monitor_id, req)


@router.delete("/monitors/{monitor_id}", status_code=204)
async def delete_monitor(
    monitor_id: UUID = Path(..., description="ID Monitor"),
    db: AsyncSession = Depends(get_db),
):
    """Menghapus target pemantauan media sosial."""
    await social_scrape_service.delete_monitor(db, monitor_id)


# ── Dummy Accounts ─────────────────────────────────────────────

@router.post("/accounts", response_model=SocialAccountResponse, status_code=201)
async def create_account(
    req: SocialAccountCreate,
    db: AsyncSession = Depends(get_db),
):
    """Menambahkan akun dummy baru berserta cookies sesinya."""
    return await social_scrape_service.create_account(db, req)


@router.get("/accounts", response_model=List[SocialAccountResponse])
async def list_accounts(
    platform: Optional[str] = Query(None, description="Filter berdasarkan platform"),
    status: Optional[str] = Query(None, description="Filter status akun (VALID/EXPIRED/BLOCKED)"),
    db: AsyncSession = Depends(get_db),
):
    """Mendaftar semua akun dummy pengumpul data."""
    return await social_scrape_service.list_accounts(db, platform=platform, status=status)


@router.get("/accounts/{account_id}", response_model=SocialAccountResponse)
async def get_account(
    account_id: UUID = Path(..., description="ID Akun"),
    db: AsyncSession = Depends(get_db),
):
    """Mendapatkan detail satu akun dummy."""
    return await social_scrape_service.get_account(db, account_id)


@router.patch("/accounts/{account_id}", response_model=SocialAccountResponse)
async def update_account(
    account_id: UUID = Path(..., description="ID Akun"),
    req: SocialAccountUpdate = ...,
    db: AsyncSession = Depends(get_db),
):
    """Memperbarui informasi kuki sesi atau status akun dummy."""
    return await social_scrape_service.update_account(db, account_id, req)


@router.delete("/accounts/{account_id}", status_code=204)
async def delete_account(
    account_id: UUID = Path(..., description="ID Akun"),
    db: AsyncSession = Depends(get_db),
):
    """Menghapus akun dummy dari sistem."""
    await social_scrape_service.delete_account(db, account_id)


# ── Proxies ────────────────────────────────────────────────────

@router.post("/proxies", response_model=SocialProxyResponse, status_code=201)
async def create_proxy(
    req: SocialProxyCreate,
    db: AsyncSession = Depends(get_db),
):
    """Menambahkan proxy baru ke pool rotator."""
    return await social_scrape_service.create_proxy(db, req)


@router.get("/proxies", response_model=List[SocialProxyResponse])
async def list_proxies(
    status: Optional[str] = Query(None, description="Filter status proxy (ACTIVE/SLOW/BLOCKED)"),
    db: AsyncSession = Depends(get_db),
):
    """Mendaftar semua proxy dalam pool."""
    return await social_scrape_service.list_proxies(db, status=status)


@router.get("/proxies/{proxy_id}", response_model=SocialProxyResponse)
async def get_proxy(
    proxy_id: UUID = Path(..., description="ID Proxy"),
    db: AsyncSession = Depends(get_db),
):
    """Mendapatkan detail satu proxy."""
    return await social_scrape_service.get_proxy(db, proxy_id)


@router.patch("/proxies/{proxy_id}", response_model=SocialProxyResponse)
async def update_proxy(
    proxy_id: UUID = Path(..., description="ID Proxy"),
    req: SocialProxyUpdate = ...,
    db: AsyncSession = Depends(get_db),
):
    """Memperbarui status atau data kegagalan proxy."""
    return await social_scrape_service.update_proxy(db, proxy_id, req)


@router.delete("/proxies/{proxy_id}", status_code=204)
async def delete_proxy(
    proxy_id: UUID = Path(..., description="ID Proxy"),
    db: AsyncSession = Depends(get_db),
):
    """Menghapus proxy dari pool."""
    await social_scrape_service.delete_proxy(db, proxy_id)


# ── Execution & Logs ───────────────────────────────────────────

@router.post("/monitors/{monitor_id}/scrape", status_code=200)
async def trigger_manual_scrape(
    monitor_id: UUID = Path(..., description="ID Monitor untuk di-scrape"),
    db: AsyncSession = Depends(get_db),
):
    """
    Memicu proses scraping media sosial secara manual dan instan
    untuk target pemantauan tertentu.
    """
    return await social_scrape_service.run_scraping_for_monitor(db, monitor_id)


@router.get("/logs", response_model=dict)
async def list_logs(
    monitor_id: Optional[UUID] = Query(None, description="Filter log berdasarkan ID monitor"),
    page: int = Query(1, ge=1, description="Halaman saat ini"),
    page_size: int = Query(20, ge=1, le=100, description="Ukuran halaman"),
    db: AsyncSession = Depends(get_db),
):
    """Mendapatkan daftar log/riwayat performa eksekusi scraping."""
    raw_logs = await social_scrape_service.list_logs(db, monitor_id=monitor_id, page=page, page_size=page_size)
    
    # Map logs to matching response schema formats
    formatted_data = []
    for log in raw_logs["data"]:
        formatted_data.append(
            SocialScrapeLogResponse(
                id=log.id,
                social_monitor_id=log.social_monitor_id,
                social_account_id=log.social_account_id,
                proxy_id=log.proxy_id,
                status=log.status,
                items_scraped=log.items_scraped,
                duration_ms=log.duration_ms,
                retry_count=log.retry_count,
                error_message=log.error_message,
                scraped_at=log.scraped_at,
                monitor_username=log.social_monitor.username if log.social_monitor else None,
                monitor_platform=log.social_monitor.platform if log.social_monitor else None,
            )
        )
    return {
        "total": raw_logs["total"],
        "page": raw_logs["page"],
        "page_size": raw_logs["page_size"],
        "data": formatted_data
    }
