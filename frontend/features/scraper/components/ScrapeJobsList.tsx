"use client";

import { useEffect, useState } from "react";
import { Clock, ExternalLink, Loader2, RefreshCcw, Eye } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useScraperStore } from "@/store/scraperStore";
import type { ScrapeStatus } from "@/types";
import ScrapeResultModal from "./ScrapeResultModal";

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
  const { scrapeJobs: jobs, scrapeJobsTotal: total, isScrapeLoading: loading, loadScrapeJobs } = useScraperStore();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenViewer = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsModalOpen(true);
  };

  useEffect(() => {
    loadScrapeJobs(1, 10);
  }, []);

  return (
    <Card glass className="overflow-hidden">
      {/* Header */}
      <CardHeader className="flex-row items-center justify-between p-4 border-b border-card-border space-y-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent-light" />
          <h3 className="text-sm font-bold text-foreground">
            Riwayat Scraping
          </h3>
          {total > 0 && (
            <span className="text-xs text-muted">({total} total)</span>
          )}
        </div>
        <Button
          onClick={() => loadScrapeJobs(1, 10)}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-1.5 cursor-pointer"
        >
          <RefreshCcw
            className={cn("w-3 h-3", loading && "animate-spin")}
          />
          Refresh
        </Button>
      </CardHeader>

      {/* Content */}
      {loading && jobs.length === 0 ? (
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Ingest</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="max-w-xs">
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
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(job.status)}>
                    {statusLabel(job.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {job.formats?.map((f) => (
                      <Badge key={f} variant="default" size="sm">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {job.is_ingested ? (
                    <Badge variant="positive" size="sm">
                      ✓ {job.ingest_count}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted whitespace-nowrap">
                  {formatDateTime(job.created_at)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {job.status === "COMPLETED" ? (
                    <Button
                      onClick={() => handleOpenViewer(job.id)}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 bg-accent/10 border-transparent text-accent-light hover:bg-accent/20 cursor-pointer font-semibold"
                    >
                      <Eye className="w-3 h-3" />
                      Lihat Hasil
                    </Button>
                  ) : job.status === "FAILED" ? (
                    <Button
                      onClick={() => handleOpenViewer(job.id)}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 bg-negative/10 border-transparent text-negative hover:bg-negative/20 cursor-pointer font-semibold"
                    >
                      <Eye className="w-3 h-3" />
                      Lihat Error
                    </Button>
                  ) : (
                    <span className="text-xs text-muted font-medium italic">
                      Memproses...
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Scrape Result Modal */}
      <ScrapeResultModal
        jobId={selectedJobId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedJobId(null);
        }}
      />
    </Card>
  );
}
