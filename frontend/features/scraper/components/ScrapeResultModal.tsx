"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { fetchScrapeJob } from "@/features/scraper/actions";
import type { ScrapeJob } from "@/types";
import ScrapeResultViewer from "./ScrapeResultViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ScrapeResultModalProps {
  jobId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ScrapeResultModal({
  jobId,
  isOpen,
  onClose,
}: ScrapeResultModalProps) {
  const [job, setJob] = useState<ScrapeJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !jobId) {
      setJob(null);
      setError(null);
      return;
    }

    const loadJobDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchScrapeJob(jobId);
        setJob(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat detail data scraping."
        );
      } finally {
        setLoading(false);
      }
    };

    loadJobDetails();
  }, [jobId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Modal Header */}
        <DialogHeader className="p-4 border-b border-card-border bg-card/40">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            Detail Hasil Scraping
          </DialogTitle>
          {job && (
            <DialogDescription className="text-[11px] font-mono truncate max-w-md sm:max-w-xl mt-0.5">
              {job.url}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-card/25 p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted text-sm">
              <Loader2 className="w-8 h-8 animate-spin text-accent-light" />
              <p className="animate-pulse">Mengambil data hasil scraping...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-negative/10 flex items-center justify-center mb-4 border border-negative/20">
                <AlertCircle className="w-6 h-6 text-negative" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                Gagal Memuat Detail
              </h4>
              <p className="text-xs text-muted leading-relaxed mb-4">{error}</p>
              <Button
                onClick={() => {
                  // Retry loading
                  if (jobId) {
                    setLoading(true);
                    setError(null);
                    fetchScrapeJob(jobId)
                      .then(setJob)
                      .catch((err) => setError(err.message || "Error"))
                      .finally(() => setLoading(false));
                  }
                }}
                variant="outline"
                size="sm"
                className="cursor-pointer"
              >
                Coba Lagi
              </Button>
            </div>
          ) : job ? (
            <div className="space-y-4">
              {job.status === "COMPLETED" ? (
                /* Renders the full tabs and content from ScrapeResultViewer */
                <ScrapeResultViewer job={job} />
              ) : job.status === "FAILED" ? (
                /* Detailed Error Card if the scrape failed */
                <div className="glass-card p-6 border border-negative/20 bg-negative/5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-negative/10 flex items-center justify-center border border-negative/20 flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-negative" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-bold text-foreground">
                          Proses Scraping Gagal
                        </h4>
                        <Badge variant="negative" size="sm">Gagal</Badge>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        Terjadi kesalahan saat memproses URL ini. Silakan periksa URL target atau coba lagi nanti.
                      </p>
                      
                      {job.error_message && (
                        <div className="mt-4 p-3 rounded-lg bg-black/30 border border-card-border font-mono text-xs text-negative whitespace-pre-wrap leading-relaxed overflow-x-auto">
                          <strong>Pesan Kesalahan:</strong>
                          <br />
                          {job.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback for processing or pending state if accessed */
                <div className="glass-card p-8 text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-warning mx-auto" />
                  <h4 className="text-sm font-semibold text-foreground">
                    Pekerjaan Sedang Berjalan
                  </h4>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Status saat ini: <span className="font-semibold text-warning">{job.status}</span>. 
                    Silakan tunggu beberapa saat dan segarkan halaman riwayat untuk meninjau hasil.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted">
              Tidak ada data yang tersedia.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
