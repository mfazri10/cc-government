"""
Inngest Client & Function Registration.
Sesuai backend-patterns.md Section 5 (Event-Driven Inngest):
- Pola pikir: Event & Workflow, bukan Queue & Task.
- Setiap fungsi wajib idempotent.
- Manfaatkan step.run() untuk checkpoint otomatis.
"""

import inngest
from app.core.config import get_settings

settings = get_settings()

# ── Inngest Client ─────────────────────────────────────────────

inngest_client = inngest.Inngest(
    app_id="govmind-sentimen-warga",
    event_key=settings.INNGEST_EVENT_KEY,
)
