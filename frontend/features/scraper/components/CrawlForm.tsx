"use client";

import { useState } from "react";
import {
  Map,
  Loader2,
  Play,
  Sliders,
  AlertCircle,
  HelpCircle,
  Clock,
  Activity,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { submitCrawlJob } from "@/features/scraper/actions";
import type { CrawlJob } from "@/types";

interface CrawlFormProps {
  onJobCreated?: (job: CrawlJob) => void;
}

export default function CrawlForm({ onJobCreated }: CrawlFormProps) {
  const [url, setUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState(2);
  const [pathFilter, setPathFilter] = useState("");
  const [limitPages, setLimitPages] = useState(50);
  const [delaySeconds, setDelaySeconds] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const job = await submitCrawlJob({
        url: url.trim(),
        max_depth: maxDepth,
        path_filter: pathFilter.trim() || undefined,
        limit_pages: limitPages,
        delay_seconds: delaySeconds,
      });
      setSuccessMsg(`Pekerjaan perayapan berhasil dikirim (ID: ${job.id})`);
      setUrl("");
      setPathFilter("");
      if (onJobCreated) {
        onJobCreated(job);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal menjalankan perayapan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Crawl Form Card */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-card-border bg-card-hover/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <Map className="w-4 h-4 text-accent-light" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Domain & Sitemap Crawler
              </h2>
              <p className="text-xs text-muted">
                Temukan dan rayap seluruh halaman dalam domain target secara berkala
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* URL Input */}
          <div className="space-y-2">
            <label
              htmlFor="crawl-url"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Root URL / Sitemap.xml
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-mono">
                  https://
                </span>
                <input
                  id="crawl-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="domain-opd.go.id/sitemap.xml"
                  className="w-full pl-[85px] pr-4 py-3 rounded-xl bg-card/60 border border-card-border text-foreground placeholder-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-smooth font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-smooth shadow-lg shadow-accent/20 disabled:shadow-none cursor-pointer whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Crawl Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Crawling
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Config Settings Grid */}
          <div className="pt-2 border-t border-card-border/60">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-foreground uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-accent-light" />
              Advanced Configuration
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Depth */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                  Max Depth
                  <span title="Kedalaman recursive scanning tautan">
                    <HelpCircle className="w-3 h-3 text-muted/60" />
                  </span>
                </label>
                <select
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-card/50 border border-card-border text-foreground text-xs focus:outline-none focus:border-accent"
                >
                  <option value="1">1 (Hanya Halaman Utama)</option>
                  <option value="2">2 (Rekomendasi)</option>
                  <option value="3">3 (Mendalam)</option>
                  <option value="4">4 (Sangat Mendalam)</option>
                  <option value="5">5 (Maksimal)</option>
                </select>
              </div>

              {/* Path Filter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                  Path Filter (Regex/String)
                </label>
                <input
                  type="text"
                  value={pathFilter}
                  onChange={(e) => setPathFilter(e.target.value)}
                  placeholder="Contoh: /berita/ atau /pengaduan/"
                  className="w-full px-3 py-2 rounded-lg bg-card/50 border border-card-border text-foreground text-xs placeholder-muted/50 focus:outline-none focus:border-accent font-mono"
                />
              </div>

              {/* Limit Pages */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                  Limit Pages
                </label>
                <select
                  value={limitPages}
                  onChange={(e) => setLimitPages(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-card/50 border border-card-border text-foreground text-xs focus:outline-none focus:border-accent"
                >
                  <option value="10">10 Halaman</option>
                  <option value="30">30 Halaman</option>
                  <option value="50">50 Halaman</option>
                  <option value="100">100 Halaman</option>
                  <option value="200">200 Halaman (Maksimal)</option>
                </select>
              </div>

              {/* Politeness Delay */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                  Politeness Delay
                </label>
                <select
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-card/50 border border-card-border text-foreground text-xs focus:outline-none focus:border-accent"
                >
                  <option value="0.5">0.5 Detik (Cepat)</option>
                  <option value="1">1.0 Detik (Rekomendasi)</option>
                  <option value="2">2.0 Detik (Aman)</option>
                  <option value="3">3.0 Detik (Sangat Sopan)</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-negative/10 border border-negative/20 text-sm text-negative">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-positive/10 border border-positive/20 text-sm text-positive">
          <Activity className="w-4 h-4 mt-0.5 flex-shrink-0 text-positive-light animate-pulse" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}
    </div>
  );
}
