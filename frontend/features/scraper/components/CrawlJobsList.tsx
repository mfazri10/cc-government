"use client";

import { useEffect, useState, Fragment } from "react";
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
import { useScraperStore } from "@/store/scraperStore";
import { fetchCrawledPages } from "@/features/scraper/actions";
import type { CrawledPage } from "@/types";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function CrawlJobsList() {
  const { crawlJobs: jobs, crawlJobsTotal: total, isCrawlLoading: isLoading, loadCrawlJobs } = useScraperStore();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [crawledPages, setCrawledPages] = useState<CrawledPage[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  useEffect(() => {
    loadCrawlJobs();
  }, []);

  // Polling jika ada job yang sedang berjalan
  useEffect(() => {
    const activeJobs = jobs.some(
      (job) => job.status === "PENDING" || job.status === "PROCESSING"
    );
    if (!activeJobs) return;

    const interval = setInterval(() => {
      loadCrawlJobs(1, 10);
      if (expandedJobId) {
        loadCrawledPagesLocal(expandedJobId, true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs, expandedJobId]);

  const loadCrawledPagesLocal = async (jobId: string, silent = false) => {
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
      loadCrawledPagesLocal(jobId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="positive" className="gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Selesai
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="negative" className="gap-1">
            <XCircle className="w-3.5 h-3.5" />
            Gagal
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="info" className="gap-1 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Memproses
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="gap-1">
            <Clock className="w-3.5 h-3.5" />
            Antrean
          </Badge>
        );
    }
  };

  return (
    <Card glass className="overflow-hidden">
      {/* Header */}
      <CardHeader className="p-5 border-b border-card-border flex-row items-center justify-between space-y-0">
        <div>
          <h2 className="text-sm font-bold text-foreground">Riwayat Perayapan</h2>
          <p className="text-xs text-muted">Daftar domain dan sitemap yang pernah dirayap</p>
        </div>
        <Button
          onClick={() => loadCrawlJobs()}
          disabled={isLoading}
          variant="outline"
          size="icon-sm"
          className="rounded-lg cursor-pointer"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </CardHeader>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Target URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pages discovered / Crawled</TableHead>
            <TableHead>Config</TableHead>
            <TableHead>Tanggal Mulai</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <div className="flex flex-col items-center gap-2 text-muted">
                  <Loader2 className="w-6 h-6 animate-spin text-accent-light" />
                  <span>Loading riwayat perayapan...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted">
                Belum ada riwayat perayapan.
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const percent =
                job.pages_discovered > 0
                  ? Math.round((job.pages_crawled / job.pages_discovered) * 100)
                  : 0;

              return (
                <Fragment key={job.id}>
                  {/* Row */}
                  <TableRow
                    className={cn(
                      isExpanded && "bg-card-hover/10"
                    )}
                  >
                    <TableCell className="max-w-[280px] truncate font-mono text-muted-foreground">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-1 text-accent-light"
                      >
                        {job.url}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between font-semibold text-xs">
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
                    </TableCell>
                    <TableCell className="text-muted text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span>Depth: {job.max_depth}</span>
                        <span>Delay: {job.delay_seconds}s</span>
                        {job.path_filter && (
                          <Badge variant="neutral" size="sm" className="w-fit font-mono text-[9px] mt-0.5">
                            {job.path_filter}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted text-xs">
                      {formatDateTime(job.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleToggleExpand(job.id)}
                        variant="outline"
                        size="sm"
                        className="gap-1 cursor-pointer"
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
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Section */}
                  {isExpanded && (
                    <TableRow className="bg-card/40">
                      <TableCell colSpan={6}>
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
                                <Card
                                  key={page.id}
                                  className="p-3 flex flex-col justify-between space-y-2 hover:border-accent-light/50 transition-smooth"
                                >
                                  <div>
                                    <div className="flex justify-between items-start gap-2">
                                      <h4 className="font-bold text-foreground line-clamp-1 text-sm">
                                        {page.title || "No Title"}
                                      </h4>
                                      <Badge variant="positive" size="sm" className="font-mono">
                                        {page.status_code || 200}
                                      </Badge>
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
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
