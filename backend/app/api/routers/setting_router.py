"""
Router Layer: System Settings endpoints.
Sesuai backend-patterns.md Section 1A:
- HANYA menerima request, validasi, panggil service, return response.
- Dilarang menulis query database atau logika bisnis di sini.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.setting import SystemSettingResponse, SystemSettingUpdate
from app.services.setting_service import setting_service

router = APIRouter(prefix="/settings", tags=["System Settings"])


@router.get("/", response_model=list[SystemSettingResponse])
async def list_settings(db: AsyncSession = Depends(get_db)):
    """Daftar semua konfigurasi sistem."""
    return await setting_service.get_all_settings(db)


@router.get("/{key}", response_model=SystemSettingResponse)
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    """Ambil satu konfigurasi sistem berdasarkan key."""
    setting = await setting_service.get_setting(db, key)
    if not setting:
        raise HTTPException(
            status_code=404,
            detail=f"Konfigurasi '{key}' tidak ditemukan."
        )
    return setting


@router.put("/{key}", response_model=SystemSettingResponse)
async def update_setting(
    key: str,
    req: SystemSettingUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update nilai konfigurasi sistem."""
    return await setting_service.update_setting(db, key, req)
