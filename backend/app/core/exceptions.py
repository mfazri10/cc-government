"""
Custom Exception classes.
Sesuai backend-patterns.md Section 3:
- Dilarang hardcode HTTPException di layer Service.
- Buat class Exception kustom di sini.
- Global Exception Handler di main.py yang menangkap dan mengubahnya jadi HTTP response.
"""


class AppException(Exception):
    """Base exception untuk seluruh aplikasi GOVMIND."""

    def __init__(self, message: str = "Terjadi kesalahan pada server."):
        self.message = message
        super().__init__(self.message)


# ── Not Found ──────────────────────────────────────────────────
class NotFoundException(AppException):
    """Resource yang diminta tidak ditemukan."""

    def __init__(self, resource: str = "Resource", identifier: str | None = None):
        detail = f"{resource} tidak ditemukan."
        if identifier:
            detail = f"{resource} dengan ID '{identifier}' tidak ditemukan."
        super().__init__(detail)


class FeedbackNotFoundException(NotFoundException):
    def __init__(self, feedback_id: str):
        super().__init__("Feedback", feedback_id)


class TargetEntityNotFoundException(NotFoundException):
    def __init__(self, entity_id: str):
        super().__init__("Target Entity", entity_id)


# ── Duplicate / Conflict ───────────────────────────────────────
class DuplicateEntryException(AppException):
    """Data sudah ada (misal: original_post_id sudah pernah di-scrape)."""

    def __init__(self, message: str = "Data sudah ada di sistem."):
        super().__init__(message)


# ── External Service Error ─────────────────────────────────────
class ExternalServiceException(AppException):
    """Error saat memanggil service eksternal (Gemini, Scrapling, Telegram)."""

    def __init__(self, service_name: str, detail: str = ""):
        message = f"Gagal terhubung ke layanan {service_name}."
        if detail:
            message += f" Detail: {detail}"
        super().__init__(message)


class GeminiServiceException(ExternalServiceException):
    def __init__(self, detail: str = ""):
        super().__init__("Google Gemini", detail)


class ScrapingServiceException(ExternalServiceException):
    def __init__(self, detail: str = ""):
        super().__init__("Scrapling", detail)


class TelegramServiceException(ExternalServiceException):
    def __init__(self, detail: str = ""):
        super().__init__("Telegram Bot", detail)


# ── Validation / Business Logic ────────────────────────────────
class ValidationException(AppException):
    """Validasi bisnis gagal."""

    def __init__(self, message: str = "Data tidak valid."):
        super().__init__(message)
