"use client";

import { useState } from "react";
import {
  Map,
  Loader2,
  Play,
  Sliders,
  AlertCircle,
  HelpCircle,
  Activity,
} from "lucide-react";
import { useScraperStore } from "@/store/scraperStore";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function CrawlForm() {
  const [url, setUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState("2");
  const [pathFilter, setPathFilter] = useState("");
  const [limitPages, setLimitPages] = useState("50");
  const [delaySeconds, setDelaySeconds] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const addCrawlJob = useScraperStore((s) => s.addCrawlJob);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await addCrawlJob({
        url: url.trim(),
        maxDepth: Number(maxDepth),
        limitPages: Number(limitPages),
        delaySeconds: Number(delaySeconds),
        pathFilter: pathFilter.trim() || undefined,
      });
      setSuccessMsg("Pekerjaan perayapan berhasil dikirim!");
      setUrl("");
      setPathFilter("");
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
      <Card glass className="overflow-hidden">
        <CardHeader className="p-5 border-b border-card-border bg-card-hover/20">
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
        </CardHeader>

        <CardContent className="p-5 pt-5">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  <Input
                    id="crawl-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="domain-opd.go.id/sitemap.xml"
                    className="pl-[85px] pr-4 py-3 h-auto rounded-xl bg-card/60 font-mono"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="flex items-center gap-2 px-6 py-3 h-auto rounded-xl gradient-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-smooth shadow-lg shadow-accent/20 disabled:shadow-none cursor-pointer whitespace-nowrap border-transparent"
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
                </Button>
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
                  <Select value={maxDepth} onValueChange={setMaxDepth}>
                    <SelectTrigger className="w-full text-xs h-9 rounded-lg bg-card/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Hanya Halaman Utama)</SelectItem>
                      <SelectItem value="2">2 (Rekomendasi)</SelectItem>
                      <SelectItem value="3">3 (Mendalam)</SelectItem>
                      <SelectItem value="4">4 (Sangat Mendalam)</SelectItem>
                      <SelectItem value="5">5 (Maksimal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Path Filter */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                    Path Filter (Regex/String)
                  </label>
                  <Input
                    type="text"
                    value={pathFilter}
                    onChange={(e) => setPathFilter(e.target.value)}
                    placeholder="Contoh: /berita/ atau /pengaduan/"
                    className="h-9 text-xs rounded-lg bg-card/50 font-mono"
                  />
                </div>

                {/* Limit Pages */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                    Limit Pages
                  </label>
                  <Select value={limitPages} onValueChange={setLimitPages}>
                    <SelectTrigger className="w-full text-xs h-9 rounded-lg bg-card/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Halaman</SelectItem>
                      <SelectItem value="30">30 Halaman</SelectItem>
                      <SelectItem value="50">50 Halaman</SelectItem>
                      <SelectItem value="100">100 Halaman</SelectItem>
                      <SelectItem value="200">200 Halaman (Maksimal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Politeness Delay */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                    Politeness Delay
                  </label>
                  <Select value={delaySeconds} onValueChange={setDelaySeconds}>
                    <SelectTrigger className="w-full text-xs h-9 rounded-lg bg-card/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5 Detik (Cepat)</SelectItem>
                      <SelectItem value="1">1.0 Detik (Rekomendasi)</SelectItem>
                      <SelectItem value="2">2.0 Detik (Aman)</SelectItem>
                      <SelectItem value="3">3.0 Detik (Sangat Sopan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

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
