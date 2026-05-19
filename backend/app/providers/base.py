"""
Abstract Base Class untuk AI/LLM Provider.
Sesuai backend-patterns.md Section 4 (Adapter Pattern):
- Dilarang memanggil SDK provider langsung di service/worker.
- Definisikan ABC, buat adapter, service hanya panggil abstraksi.
"""

from abc import ABC, abstractmethod


class BaseSentimentAnalyzer(ABC):
    """
    Interface abstrak untuk analisis sentimen.
    Memudahkan hot-swap provider (Gemini → OpenAI → Ollama) tanpa merusak kode.
    """

    @abstractmethod
    async def analyze(self, text: str) -> dict:
        """
        Analisis teks dan kembalikan hasil terstruktur.

        Returns:
            dict: {
                "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
                "emotion": "Marah" | "Panik" | "Sedih" | "Apresiasi" | "Harapan" | None,
                "topics": ["topik1", "topik2"],
                "summary": "Ringkasan singkat...",
                "needs_attention": True | False
            }
        """
        pass

    @abstractmethod
    async def batch_analyze(self, texts: list[str]) -> list[dict]:
        """Batch version of analyze()."""
        pass
