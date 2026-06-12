from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# ── SocialMonitor Schemas ─────────────────────────────────────
class SocialMonitorBase(BaseModel):
    platform: str
    username: str
    target_entity_id: int
    is_active: bool = True
    scrape_interval_hours: int = 24
    max_posts_per_run: int = 10
    config: Optional[Dict[str, Any]] = None

class SocialMonitorCreate(SocialMonitorBase):
    pass

class SocialMonitorUpdate(BaseModel):
    is_active: Optional[bool] = None
    scrape_interval_hours: Optional[int] = None
    max_posts_per_run: Optional[int] = None
    config: Optional[Dict[str, Any]] = None

class SocialMonitorResponse(SocialMonitorBase):
    id: UUID
    last_cursor: Optional[str] = None
    consecutive_failures: int
    last_scraped_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional relation name
    target_entity_name: Optional[str] = None

    class Config:
        from_attributes = True

# ── SocialAccount Schemas ─────────────────────────────────────
class SocialAccountBase(BaseModel):
    platform: str
    username: str
    status: str = "VALID"
    proxy_url: Optional[str] = None

class SocialAccountCreate(SocialAccountBase):
    cookies: Dict[str, Any] = Field(..., description="Kuki sesi mentah dalam format JSON. Akan dienkripsi saat disimpan.")

class SocialAccountUpdate(BaseModel):
    status: Optional[str] = None
    proxy_url: Optional[str] = None
    cookies: Optional[Dict[str, Any]] = None

class SocialAccountResponse(SocialAccountBase):
    id: UUID
    last_used_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True

# ── SocialProxy Schemas ───────────────────────────────────────
class SocialProxyBase(BaseModel):
    proxy_url: str = Field(..., description="Format: http://user:pass@host:port")
    protocol: str = "http"
    status: str = "ACTIVE"

class SocialProxyCreate(SocialProxyBase):
    pass

class SocialProxyUpdate(BaseModel):
    status: Optional[str] = None
    failure_count: Optional[int] = None

class SocialProxyResponse(SocialProxyBase):
    id: UUID
    failure_count: int
    last_checked_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ── SocialScrapeLog Schemas ───────────────────────────────────
class SocialScrapeLogResponse(BaseModel):
    id: UUID
    social_monitor_id: UUID
    social_account_id: Optional[UUID] = None
    proxy_id: Optional[UUID] = None
    status: str
    items_scraped: int
    duration_ms: int
    retry_count: int
    error_message: Optional[str] = None
    scraped_at: datetime

    # Tambahan nama platform/target untuk mempermudah visualisasi log di UI
    monitor_username: Optional[str] = None
    monitor_platform: Optional[str] = None

    class Config:
        from_attributes = True
