"use client";

import { useState } from "react";
import {
  Globe,
  Loader2,
  Play,
  FileText,
  Link2,
  Braces,
  Camera,
  Lock,
  AlertCircle,
  Sparkles,
  Code,
  Image,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { submitScrapeJob } from "@/features/scraper/actions";
import type { ScrapeJob } from "@/types";
import ScrapeResultViewer from "./ScrapeResultViewer";
import GetCodeModal from "./GetCodeModal";

interface FormatOption {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  locked?: boolean;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "markdown",
    label: "Markdown",
    icon: FileText,
    description: "Teks bersih tanpa iklan",
  },
  {
    id: "links",
    label: "Links",
    icon: Link2,
    description: "Semua hyperlink",
  },
  {
    id: "json",
    label: "JSON",
    icon: Braces,
    description: "AI structured extract",
  },
  {
    id: "summary",
    label: "Summary",
    icon: Sparkles,
    description: "Rangkuman AI 1-2 paragraf",
  },
  {
    id: "html",
    label: "HTML",
    icon: Code,
    description: "HTML bersih",
  },
  {
    id: "images",
    label: "Images",
    icon: Image,
    description: "Semua gambar",
  },
  {
    id: "screenshot",
    label: "Screenshot",
    icon: Camera,
    description: "Fase 2",
    locked: true,
  },
];

export default function ScrapeForm() {
  const [url, setUrl] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<string[]>([
    "markdown",
    "links",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGetCode, setShowGetCode] = useState(false);

  const toggleFormat = (formatId: string) => {
    setSelectedFormats((prev) =>
      prev.includes(formatId)
        ? prev.filter((f) => f !== formatId)
        : [...prev, formatId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || selectedFormats.length === 0) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const job = await submitScrapeJob({
        url: url.trim(),
        formats: selectedFormats.filter((f) => f !== "screenshot"),
      });
      setResult(job);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal menjalankan scraping."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scrape Form Card */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-card-border bg-card-hover/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <Globe className="w-4 h-4 text-accent-light" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Single URL Scraper
              </h2>
              <p className="text-xs text-muted">
                Masukkan URL dan pilih format output yang diinginkan
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* URL Input */}
          <div className="space-y-2">
            <label
              htmlFor="scrape-url"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Target URL
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-mono">
                  https://
                </span>
                <input
                  id="scrape-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.com/page"
                  className="w-full pl-[85px] pr-4 py-3 rounded-xl bg-card/60 border border-card-border text-foreground placeholder-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-smooth font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={
                  isLoading || !url.trim() || selectedFormats.length === 0
                }
                className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-smooth shadow-lg shadow-accent/20 disabled:shadow-none cursor-pointer whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Scraping
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowGetCode(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-card-border text-muted text-sm font-medium hover:text-foreground hover:bg-card-hover transition-smooth cursor-pointer whitespace-nowrap"
              >
                <Code className="w-4 h-4" />
                Get Code
              </button>
            </div>
          </div>

          {/* Format Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Select Formats
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {FORMAT_OPTIONS.map((format) => {
                const isSelected = selectedFormats.includes(format.id);
                const Icon = format.icon;

                return (
                  <button
                    key={format.id}
                    type="button"
                    disabled={format.locked}
                    onClick={() => !format.locked && toggleFormat(format.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-smooth cursor-pointer",
                      format.locked
                        ? "border-card-border/50 bg-card/30 opacity-50 cursor-not-allowed"
                        : isSelected
                          ? "border-accent/50 bg-accent/10 shadow-lg shadow-accent/10"
                          : "border-card-border bg-card/40 hover:border-card-border hover:bg-card-hover"
                    )}
                  >
                    {format.locked && (
                      <Lock className="absolute top-2 right-2 w-3 h-3 text-muted/50" />
                    )}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-smooth",
                        isSelected
                          ? "bg-accent/20 text-accent-light"
                          : "bg-card-hover text-muted"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        isSelected ? "text-accent-light" : "text-foreground"
                      )}
                    >
                      {format.label}
                    </span>
                    <span className="text-[9px] text-muted leading-tight">
                      {format.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>

      {/* Status Banners */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-negative/10 border border-negative/20 text-sm text-negative">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Result Viewer */}
      {result && result.status === "COMPLETED" && (
        <ScrapeResultViewer job={result} />
      )}

      {result && result.status === "FAILED" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-negative/10 border border-negative/20 text-sm text-negative">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Scraping gagal</p>
            <p className="text-xs mt-1 opacity-80">
              {result.error_message || "Unknown error"}
            </p>
          </div>
        </div>
      )}

      {/* Get Code Modal */}
      <GetCodeModal
        url={url}
        formats={selectedFormats.filter((f) => f !== "screenshot")}
        isOpen={showGetCode}
        onClose={() => setShowGetCode(false)}
      />
    </div>
  );
}
