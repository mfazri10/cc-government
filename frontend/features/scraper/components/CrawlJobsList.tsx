"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { fetchCrawlJobs, fetchCrawledPages } from "@/features/scraper/actions";
import type { CrawlJob, CrawledPage } from "@/types";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";

export default function CrawlJobsList() {
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [crawledPages, setCrawledPages] = useState<CrawledPage[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  const loadJobs = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetchCrawlJobs(page, pageSize);
      setJobs(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to fetch crawl jobs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [page]);

  // Polling jika ada job yang sedang berjalan
  useEffect(() => {
    const activeJobs = jobs.some(
      (job) => job.status === "PENDING" || job.status === "PROCESSING"
    );
    if (!activeJobs) return;

    const interval = setInterval(() => {
      loadJobs(true);
      if (expandedJobId) {
        loadCrawledPages(expandedJobId, true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs, expandedJobId]);

  const loadCrawledPages = async (jobId: string, silent = false) => {
    if (!silent) setIsLoadingPages(true);
    try {
      const pages = await fetchCrawledPages(jobId);
      setCrawledPages(pages);
    } catch (err) {
      console.error("Failed to load crawled pages:", err);
    } finally {
      setIsLoadingPages(false);
    }
  };

  const handleToggleExpand = (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      setCrawledPages([]);
    } else {
      setExpandedJobId(jobId);
      loadCrawledPages(jobId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-positive/10 text-positive">
            <CheckCircle className="w-3.5 h-3.5" />
            Selesai
          </span>
        );
      case "FAILED":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-negative/10 text-negative">
            <XCircle className="w-3.5 h-3.5" />
            Gagal
          </span>
        );
      case "PROCESSING":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-info/10 text-info-light animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-info" />
            Memproses
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-muted/10 text-muted">
            <Clock className="w-3.5 h-3.5" />
            Antrean
          </span>
        );
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-card-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">Riwayat Perayapan</h2>
          <p className="text-xs text-muted">Daftar domain dan sitemap yang pernah dirayap</p>
        </div>
        <button
          onClick={() => loadJobs()}
          disabled={isLoading}
          className="p-2 rounded-lg border border-card-border hover:bg-card-hover text-muted hover:text-foreground transition-smooth cursor-pointer disabled:opacity-40"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-card-border/60 text-muted uppercase tracking-wider font-semibold">
              <th className="p-4">Target URL</th>
              <th className="p-4">Status</th>
              <th className="p-4">Pages discovered / Crawled</th>
              <th className="p-4">Config</th>
              <th className="p-4">Tanggal Mulai</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-accent-light" />
                    <span>Loading riwayat perayapan...</span>
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  Belum ada riwayat perayapan.
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                const percent =
                  job.pages_discovered > 0
                    ? Math.round((job.pages_crawled / job.pages_discovered) * 100)
                    : 0;

                return (
                  <>
                    {/* Row */}
                    <tr
                      key={job.id}
                      className={cn(
                        "border-b border-card-border/60 hover:bg-card-hover/20 transition-smooth",
                        isExpanded && "bg-card-hover/10"
                      )}
                    >
                      <td className="p-4 max-w-[280px] truncate font-mono text-muted-foreground">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1 text-accent-light"
                        >
                          {job.url}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="p-4">{getStatusBadge(job.status)}</td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span>
                              {job.pages_crawled} / {job.pages_discovered}
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full bg-card border border-card-border h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent transition-smooth"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted flex flex-col gap-0.5">
                        <span>Depth: {job.max_depth}</span>
                        <span>Delay: {job.delay_seconds}s</span>
                        {job.path_filter && (
                          <span className="truncate max-w-[120px] font-mono text-[9px] bg-card border border-card-border px-1.5 py-0.5 rounded">
                            {job.path_filter}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted">
                        {formatDateTime(job.created_at)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleExpand(job.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-card-border hover:bg-card-hover hover:text-foreground text-muted font-medium transition-smooth cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              Tutup <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Detail <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Section */}
                    {isExpanded && (
                      <tr className="bg-card/40 border-b border-card-border/60">
                        <td colSpan={6} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-card-border pb-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                <BookOpen className="w-4 h-4 text-accent-light" />
                                Halaman Hasil Perayapan ({crawledPages.length})
                              </div>
                            </div>

                            {isLoadingPages ? (
                              <div className="py-8 text-center text-muted flex justify-center items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-accent" />
                                Loading halaman hasil perayapan...
                              </div>
                            ) : crawledPages.length === 0 ? (
                              <div className="py-4 text-center text-muted">
                                Belum ada halaman yang berhasil dirayap.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                                {crawledPages.map((page) => (
                                  <div
                                    key={page.id}
                                    className="p-3 rounded-xl border border-card-border bg-card/60 flex flex-col justify-between space-y-2 hover:border-accent-light/50 transition-smooth"
                                  >
                                    <div>
                                      <div className="flex justify-between items-start gap-2">
                                        <h4 className="font-bold text-foreground line-clamp-1">
                                          {page.title || "No Title"}
                                        </h4>
                                        <span className="text-[9px] bg-positive-bg text-positive px-1.5 py-0.5 rounded font-mono font-semibold">
                                          {page.status_code || 200}
                                        </span>
                                      </div>
                                      <a
                                        href={page.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] text-accent-light font-mono truncate block hover:underline"
                                      >
                                        {page.url}
                                      </a>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground bg-card p-2 rounded-lg font-mono line-clamp-3">
                                      {page.markdown_snippet || "Tidak ada konten."}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
