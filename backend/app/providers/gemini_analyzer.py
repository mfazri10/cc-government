"""
Adapter: Google Gemini sebagai Sentiment Analyzer.
Sesuai backend-patterns.md Section 4:
- Implementasi konkret dari BaseSentimentAnalyzer.
- SDK Gemini hanya di-import di file ini, TIDAK di service/worker.
"""

import json

import google.generativeai as genai

from app.core.config import get_settings
from app.core.exceptions import GeminiServiceException
from app.providers.base import BaseSentimentAnalyzer

settings = get_settings()

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """Kamu adalah sistem analisis sentimen untuk pemerintah Kota Cimahi, Indonesia.

Tugasmu: Analisis teks ulasan/komentar warga dan kembalikan hasilnya dalam format JSON VALID (tanpa markdown, tanpa komentar).

Format output yang WAJIB:
{
  "sentiment": "POSITIVE" atau "NEGATIVE" atau "NEUTRAL",
  "emotion": salah satu dari "Marah", "Panik", "Sedih", "Apresiasi", "Harapan", atau null,
  "topics": ["topik1", "topik2"],
  "summary": "Ringkasan singkat maksimal 2 kalimat dalam Bahasa Indonesia",
  "needs_attention": true jika teks mengandung urgensi tinggi (bencana, kecelakaan, ancaman keselamatan), false jika tidak
}

Aturan:
1. Pahami bahasa Indonesia termasuk bahasa Sunda, singkatan, dan bahasa gaul.
2. Topics harus berupa kata kunci spesifik (contoh: "Jalan Berlubang", "Antrian Panjang", "Sampah Menumpuk").
3. Jangan hallucinate — hanya ekstrak informasi yang benar-benar ada di teks.
4. Output HARUS berupa JSON valid, tanpa penjelasan tambahan.
"""


class GeminiSentimentAnalyzer(BaseSentimentAnalyzer):
    """Implementasi sentiment analyzer menggunakan Google Gemini Flash."""

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )

    async def analyze(self, text: str) -> dict:
        """Analisis satu teks ulasan."""
        try:
            response = await self.model.generate_content_async(
                f"Analisis ulasan berikut:\n\n\"{text}\""
            )
            result = json.loads(response.text)
            return self._validate_result(result)
        except json.JSONDecodeError as e:
            raise GeminiServiceException(f"Response bukan JSON valid: {e}")
        except Exception as e:
            raise GeminiServiceException(str(e))

    async def batch_analyze(self, texts: list[str]) -> list[dict]:
        """Batch analisis — proses satu per satu untuk kontrol error yang lebih baik."""
        results = []
        for text in texts:
            try:
                result = await self.analyze(text)
                results.append(result)
            except GeminiServiceException:
                # Jika satu gagal, masukkan fallback agar batch tidak berhenti total
                results.append({
                    "sentiment": "NEUTRAL",
                    "emotion": None,
                    "topics": [],
                    "summary": "Gagal dianalisis.",
                    "needs_attention": False,
                })
        return results

    def _validate_result(self, result: dict) -> dict:
        """Pastikan output Gemini memiliki semua field yang dibutuhkan."""
        valid_sentiments = {"POSITIVE", "NEGATIVE", "NEUTRAL"}
        valid_emotions = {"Marah", "Panik", "Sedih", "Apresiasi", "Harapan", None}

        sentiment = result.get("sentiment", "NEUTRAL")
        if sentiment not in valid_sentiments:
            sentiment = "NEUTRAL"

        emotion = result.get("emotion")
        if emotion not in valid_emotions:
            emotion = None

        return {
            "sentiment": sentiment,
            "emotion": emotion,
            "topics": result.get("topics", []),
            "summary": result.get("summary"),
            "needs_attention": bool(result.get("needs_attention", False)),
        }
