"""
Service Layer: System Settings operations.
Sesuai backend-patterns.md Section 1B:
- Semua logika bisnis ada di sini.
- Agnostik terhadap HTTP (tidak tahu Request, Header, HTTPException).
- Me-return data model murni atau raise custom exception.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.models import SystemSetting
from app.schemas.setting import SystemSettingUpdate

app_settings = get_settings()


class SettingService:
    """Handles all business logic for system settings."""

    async def get_all_settings(self, db: AsyncSession) -> list[SystemSetting]:
        """Ambil semua konfigurasi sistem."""
        result = await db.execute(select(SystemSetting))
        return list(result.scalars().all())

    async def get_setting(self, db: AsyncSession, key: str) -> SystemSetting | None:
        """Ambil satu konfigurasi berdasarkan key."""
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        return result.scalar_one_or_none()

    async def update_setting(self, db: AsyncSession, key: str, data: SystemSettingUpdate) -> SystemSetting:
        """Update nilai konfigurasi. Jika key belum ada, buat baru."""
        setting = await self.get_setting(db, key)
        if not setting:
            setting = SystemSetting(
                key=key,
                value=data.value,
                description=f"Konfigurasi dinamis untuk {key}"
            )
            db.add(setting)
        else:
            setting.value = data.value

        await db.commit()
        await db.refresh(setting)
        return setting

    async def get_gemini_api_key(self, db: AsyncSession) -> str:
        """
        Ambil GEMINI_API_KEY dari database.
        Jika kosong atau tidak ada, lakukan fallback ke environment variable (.env).
        """
        setting = await self.get_setting(db, "GEMINI_API_KEY")
        if setting and setting.value.strip():
            return setting.value.strip()
        return app_settings.GEMINI_API_KEY


# Singleton instance
setting_service = SettingService()
