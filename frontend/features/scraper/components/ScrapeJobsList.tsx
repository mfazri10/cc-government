"use client";

import { useEffect, useState } from "react";
import { Clock, ExternalLink, Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import Badge from "@/components/ui/Badge";
import { fetchScrapeJobs } from "@/features/scraper/actions";
import type { ScrapeJobListItem, ScrapeStatus } from "@/types";

function statusVariant(
  status: ScrapeStatus
): "positive" | "negative" | "warning" | "default" {
  if (status === "COMPLETED") return "positive";
  if (status === "FAILED") return "negative";
  if (status === "PROCESSING") return "warning";
  return "default";
}

function statusLabel(status: ScrapeStatus): string {
  if (status === "COMPLETED") return "Selesai";
  if (status === "FAILED") return "Gagal";
  if (status === "PROCESSING") return "Proses...";
  return "Antrian";
}

export default function ScrapeJobsList() {
  const [jobs, setJobs] = useState<ScrapeJobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const result = await fetchScrapeJobs(1, 10);
      setJobs(result.data);
      setTotal(result.total);
    } catch {
      // Silent fail — tabel akan kosong
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-card-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent-light" />
          <h3 className="text-sm font-bold text-foreground">
            Riwayat Scraping
          </h3>
          {total > 0 && (
            <span className="text-xs text-muted">({total} total)</span>
          )}
        </div>
        <button
          onClick={loadJobs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-card-border text-muted hover:text-foreground hover:bg-card-hover transition-smooth cursor-pointer disabled:opacity-50"
        >
          <RefreshCcw
            className={cn("w-3 h-3", loading && "animate-spin")}
          />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat riwayat...
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-muted text-sm">
            Belum ada riwayat scraping. Mulai dengan menjalankan scrape di atas.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  URL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Format
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Ingest
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Waktu
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-card-hover transition-smooth"
                >
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                      <span className="text-foreground truncate font-mono text-xs">
                        {job.url}
                      </span>
                    </div>
                    {job.error_message && (
                      <p className="text-[10px] text-negative mt-1 truncate max-w-xs">
                        {job.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(job.status)}>
                      {statusLabel(job.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {job.formats?.map((f) => (
                        <Badge key={f} variant="default" size="sm">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {job.is_ingested ? (
                      <Badge variant="positive" size="sm">
                        ✓ {job.ingest_count}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    {formatDateTime(job.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
