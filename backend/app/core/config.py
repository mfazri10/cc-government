"""
Core configuration module.
Menggunakan pydantic-settings agar variabel environment di-validasi saat startup.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/govmind_sentimen"

    # Google Gemini
    GEMINI_API_KEY: str = ""

    # Google Serper API
    SERPER_API_KEY: str = ""

    # JWT Authentication
    JWT_SECRET_KEY: str = "govmind-secret-key-super-secure-change-it-in-env-98213892"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Inngest
    INNGEST_EVENT_KEY: str = ""
    INNGEST_SIGNING_KEY: str = ""

    # Telegram Bot
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_data"

    # App
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Singleton pattern untuk settings."""
    return Settings()
