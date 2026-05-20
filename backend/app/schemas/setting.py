"""
Pydantic Schemas untuk modul System Settings.
Sesuai backend-patterns.md Section 1C & Section 7:
- Schemas terpisah dari ORM models.
- Type hinting disiplin di seluruh file.
"""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SystemSettingBase(BaseModel):
    key: str = Field(..., max_length=100, examples=["GEMINI_API_KEY"])
    value: str = Field(..., description="Nilai konfigurasi")
    description: str | None = Field(None, max_length=255, examples=["Google Gemini API Key"])


class SystemSettingCreate(SystemSettingBase):
    pass


class SystemSettingUpdate(BaseModel):
    value: str = Field(..., description="Nilai konfigurasi baru")


class SystemSettingResponse(SystemSettingBase):
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
