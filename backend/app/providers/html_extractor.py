"""
Adapter: HTML Extractor menggunakan httpx + BeautifulSoup + markdownify.
Sesuai backend-patterns.md Section 4 (Adapter Pattern):
- Abstract Base Class didefinisikan di sini.
- Implementasi konkret menggunakan httpx (async HTTP client).
- Service hanya memanggil abstraksi, bukan SDK langsung.
"""

import re
from abc import ABC, abstractmethod
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from markdownify import markdownify as md

from app.core.exceptions import ScrapingServiceException


class BaseHtmlExtractor(ABC):
    """Interface abstrak untuk ekstraksi konten web."""

    @abstractmethod
    async def fetch_html(self, url: str) -> str:
        """Ambil HTML mentah dari URL target."""
        pass

    @abstractmethod
    def to_markdown(self, html: str) -> str:
        """Konversi HTML menjadi Markdown bersih (tanpa navigasi, iklan, footer)."""
        pass

    @abstractmethod
    def extract_links(self, html: str, base_url: str) -> list[dict]:
        """Ekstrak semua link dari HTML beserta anchor text."""
        pass

    @abstractmethod
    def extract_metadata(self, html: str, url: str) -> dict:
        """Ekstrak metadata halaman (title, description, favicon, og:image, dll)."""
        pass

    @abstractmethod
    def extract_images(self, html: str, base_url: str) -> list[dict]:
        """Ekstrak semua gambar dari HTML beserta alt text."""
        pass

    @abstractmethod
    def get_clean_html(self, html: str) -> str:
        """Return HTML bersih (tanpa nav/footer/ads/scripts)."""
        pass


class HttpxHtmlExtractor(BaseHtmlExtractor):
    """
    Implementasi ringan menggunakan httpx + BeautifulSoup.
    Cocok untuk halaman statis. Untuk SPA/dynamic pages, gunakan PlaywrightExtractor (Fase 2).
    """

    DEFAULT_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    # Tags yang akan dihapus sebelum konversi markdown
    NOISE_TAGS = [
        "nav", "header", "footer", "aside", "script", "style", "noscript",
        "iframe", "form", "button", "svg", "canvas",
    ]

    # Class/ID patterns yang menandakan elemen non-konten
    NOISE_PATTERNS = re.compile(
        r"(nav|menu|sidebar|footer|header|advertisement|ad-|cookie|popup|modal|banner|social)",
        re.IGNORECASE,
    )

    async def fetch_html(self, url: str) -> str:
        """Fetch HTML dari URL menggunakan httpx async client."""
        try:
            async with httpx.AsyncClient(
                follow_redirects=True,
                timeout=30.0,
                headers=self.DEFAULT_HEADERS,
            ) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.text
        except httpx.HTTPStatusError as e:
            raise ScrapingServiceException(
                f"HTTP {e.response.status_code} saat mengakses {url}"
            )
        except httpx.RequestError as e:
            raise ScrapingServiceException(
                f"Gagal terhubung ke {url}: {str(e)}"
            )

    def _clean_soup(self, html: str) -> BeautifulSoup:
        """Bersihkan HTML dari elemen noise (nav, footer, ads, scripts)."""
        soup = BeautifulSoup(html, "html.parser")

        # Hapus tag noise
        for tag_name in self.NOISE_TAGS:
            for tag in soup.find_all(tag_name):
                tag.decompose()

        # Hapus elemen dengan class/id yang match noise pattern
        for tag in soup.find_all(True):
            if not getattr(tag, "attrs", None):
                continue
            classes = " ".join(tag.get("class") or [])
            tag_id = tag.get("id") or ""
            if self.NOISE_PATTERNS.search(classes) or self.NOISE_PATTERNS.search(tag_id):
                tag.decompose()

        return soup

    def to_markdown(self, html: str) -> str:
        """Konversi HTML bersih menjadi Markdown."""
        soup = self._clean_soup(html)

        # Ambil hanya konten body
        body = soup.find("body")
        if body:
            raw_md = md(str(body), heading_style="ATX", strip=["img"])
        else:
            raw_md = md(str(soup), heading_style="ATX", strip=["img"])

        # Bersihkan whitespace berlebih
        lines = raw_md.split("\n")
        cleaned_lines = []
        prev_empty = False
        for line in lines:
            stripped = line.strip()
            if not stripped:
                if not prev_empty:
                    cleaned_lines.append("")
                    prev_empty = True
            else:
                cleaned_lines.append(stripped)
                prev_empty = False

        return "\n".join(cleaned_lines).strip()

    def extract_links(self, html: str, base_url: str) -> list[dict]:
        """Ekstrak semua hyperlink dari halaman."""
        soup = BeautifulSoup(html, "html.parser")
        links = []
        seen_urls = set()

        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"].strip()
            if not href or href.startswith("#") or href.startswith("javascript:"):
                continue

            # Resolve relative URLs
            absolute_url = urljoin(base_url, href)
            if absolute_url in seen_urls:
                continue
            seen_urls.add(absolute_url)

            text = a_tag.get_text(strip=True) or ""
            links.append({
                "url": absolute_url,
                "text": text[:200],  # Limit text length
                "is_external": urlparse(absolute_url).netloc != urlparse(base_url).netloc,
            })

        return links

    def extract_metadata(self, html: str, url: str) -> dict:
        """Ekstrak metadata halaman web."""
        soup = BeautifulSoup(html, "html.parser")

        title = ""
        title_tag = soup.find("title")
        if title_tag:
            title = title_tag.get_text(strip=True)

        description = ""
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            description = meta_desc.get("content", "")

        # Open Graph
        og_image = ""
        og_img_tag = soup.find("meta", attrs={"property": "og:image"})
        if og_img_tag:
            og_image = og_img_tag.get("content", "")

        og_title = ""
        og_title_tag = soup.find("meta", attrs={"property": "og:title"})
        if og_title_tag:
            og_title = og_title_tag.get("content", "")

        # Favicon
        favicon = ""
        icon_link = soup.find("link", rel=lambda r: r and "icon" in r)
        if icon_link:
            favicon = urljoin(url, icon_link.get("href", ""))

        # Language
        lang = ""
        html_tag = soup.find("html")
        if html_tag:
            lang = html_tag.get("lang", "")

        return {
            "title": title or og_title,
            "description": description,
            "og_image": og_image,
            "favicon": favicon,
            "language": lang,
            "domain": urlparse(url).netloc,
        }

    def extract_images(self, html: str, base_url: str) -> list[dict]:
        """Ekstrak semua gambar dari halaman web."""
        soup = BeautifulSoup(html, "html.parser")
        images = []
        seen_srcs = set()

        for img_tag in soup.find_all("img"):
            src = img_tag.get("src", "").strip()
            if not src or src.startswith("data:"):
                continue

            absolute_src = urljoin(base_url, src)
            if absolute_src in seen_srcs:
                continue
            seen_srcs.add(absolute_src)

            images.append({
                "src": absolute_src,
                "alt": img_tag.get("alt", "")[:200],
                "width": img_tag.get("width"),
                "height": img_tag.get("height"),
            })

        return images

    def get_clean_html(self, html: str) -> str:
        """Return HTML bersih (tanpa nav/footer/ads/scripts)."""
        soup = self._clean_soup(html)
        body = soup.find("body")
        if body:
            return str(body)
        return str(soup)

