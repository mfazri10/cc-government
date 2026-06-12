import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.models import Base

class SocialMonitor(Base):
    """Tabel untuk menyimpan data target pemantauan media sosial."""
    __tablename__ = "social_monitors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)  # 'instagram', 'tiktok', 'facebook', 'twitter'
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    target_entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("target_entities.id", ondelete="RESTRICT"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    scrape_interval_hours: Mapped[int] = mapped_column(Integer, default=24)
    max_posts_per_run: Mapped[int] = mapped_column(Integer, default=10)
    last_cursor: Mapped[str | None] = mapped_column(String(500), nullable=True)
    consecutive_failures: Mapped[int] = mapped_column(Integer, default=0)
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    last_scraped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    target_entity: Mapped["TargetEntity"] = relationship()
    scrape_logs: Mapped[list["SocialScrapeLog"]] = relationship(back_populates="social_monitor", cascade="all, delete-orphan")

    @property
    def target_entity_name(self) -> str | None:
        if "target_entity" in self.__dict__:
            return self.target_entity.name if self.target_entity else None
        return None

    __table_args__ = (
        UniqueConstraint("platform", "username", name="uq_social_monitors_platform_username"),
    )

    def __repr__(self) -> str:
        return f"<SocialMonitor(id={self.id}, platform='{self.platform}', username='{self.username}')>"


class SocialAccount(Base):
    """Tabel untuk menyimpan akun dummy/scraper dan kuki sesi terenkripsi."""
    __tablename__ = "social_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)  # 'instagram', 'tiktok', 'facebook', 'twitter'
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    cookies_encrypted: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="VALID")  # 'VALID', 'EXPIRED', 'BLOCKED'
    proxy_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    scrape_logs: Mapped[list["SocialScrapeLog"]] = relationship(back_populates="social_account")

    __table_args__ = (
        UniqueConstraint("platform", "username", name="uq_social_accounts_platform_username"),
    )

    def __repr__(self) -> str:
        return f"<SocialAccount(id={self.id}, platform='{self.platform}', username='{self.username}', status='{self.status}')>"


class SocialProxy(Base):
    """Pool proxy untuk rotasi IP dan mencegah pemblokiran."""
    __tablename__ = "social_proxies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    proxy_url: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    protocol: Mapped[str] = mapped_column(String(10), nullable=False)  # 'http', 'socks5'
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE")  # 'ACTIVE', 'SLOW', 'BLOCKED'
    failure_count: Mapped[int] = mapped_column(Integer, default=0)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    scrape_logs: Mapped[list["SocialScrapeLog"]] = relationship(back_populates="social_proxy")

    def __repr__(self) -> str:
        return f"<SocialProxy(id={self.id}, status='{self.status}', failure_count={self.failure_count})>"


class SocialScrapeLog(Base):
    """Pencatatan metrik performa dan audit trail eksekusi scraper."""
    __tablename__ = "social_scrape_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    social_monitor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("social_monitors.id", ondelete="RESTRICT"), nullable=False)
    social_account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("social_accounts.id", ondelete="SET NULL"), nullable=True)
    proxy_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("social_proxies.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # 'SUCCESS', 'FAILED'
    items_scraped: Mapped[int] = mapped_column(Integer, default=0)
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    scraped_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    social_monitor: Mapped["SocialMonitor"] = relationship(back_populates="scrape_logs")
    social_account: Mapped["SocialAccount"] = relationship(back_populates="scrape_logs")
    social_proxy: Mapped["SocialProxy"] = relationship(back_populates="scrape_logs")

    def __repr__(self) -> str:
        return f"<SocialScrapeLog(id={self.id}, status='{self.status}', items_scraped={self.items_scraped})>"
