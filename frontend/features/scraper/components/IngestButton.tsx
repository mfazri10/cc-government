"use client";

import { useState } from "react";
import { Database, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { ingestScrapeResults } from "@/features/scraper/actions";
import type { IngestResult, TargetEntity } from "@/types";

interface IngestButtonProps {
  jobId: string;
  isIngested: boolean;
  ingestCount: number;
  sources: Source[];
  entities: TargetEntity[];
}

interface Source {
  id: number;
  name: string;
  type: string;
}

export default function IngestButton({
  jobId,
  isIngested: initialIngested,
  ingestCount: initialCount,
  sources,
  entities,
}: IngestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceId, setSourceId] = useState<number>(sources[0]?.id || 0);
  const [entityId, setEntityId] = useState<number | undefined>(undefined);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isIngested, setIsIngested] = useState(initialIngested);
  const [ingestCount, setIngestCount] = useState(initialCount);

  const handleIngest = async () => {
    if (!sourceId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await ingestScrapeResults(
        jobId,
        sourceId,
        entityId,
        autoAnalyze
      );
      setResult(res);
      setIsIngested(true);
      setIngestCount(res.feedbacks_created);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal meng-ingest data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Already ingested — show status
  if (isIngested && !isOpen) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-positive/10 border border-positive/20 text-xs text-positive font-medium">
        <CheckCircle2 className="w-3 h-3" />
        Ingested ({ingestCount} feedback)
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-info/10 border border-info/20 text-info hover:bg-info/20 transition-smooth cursor-pointer"
        >
          <Database className="w-3 h-3" />
          Ingest to Pipeline
        </button>
      )}

      {/* Ingest Form */}
      {isOpen && !result && (
        <div className="glass-card p-4 space-y-3 border border-info/20 min-w-[300px]">
          <p className="text-xs font-semibold text-foreground">
            Ingest ke Pipeline Sentimen
          </p>

          {/* Source Select */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted uppercase tracking-wider font-medium">
              Source
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-card border border-card-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-info/50"
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Select */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted uppercase tracking-wider font-medium">
              Target Entity (opsional)
            </label>
            <select
              value={entityId || ""}
              onChange={(e) =>
                setEntityId(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full px-3 py-2 rounded-lg bg-card border border-card-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-info/50"
            >
              <option value="">— Tidak ada —</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-Analyze Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAnalyze}
              onChange={(e) => setAutoAnalyze(e.target.checked)}
              className="rounded border-card-border text-info focus:ring-info/50"
            />
            <span className="text-xs text-foreground">
              Auto-analyze dengan Gemini AI
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-negative">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleIngest}
              disabled={isLoading || !sourceId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-smooth cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Ingesting...
                </>
              ) : (
                <>
                  <Database className="w-3 h-3" /> Ingest
                </>
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-lg border border-card-border text-xs text-muted hover:text-foreground hover:bg-card-hover transition-smooth cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="glass-card p-4 space-y-2 border border-positive/20 min-w-[280px]">
          <div className="flex items-center gap-2 text-positive text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Berhasil di-ingest!
          </div>
          <div className="text-xs text-muted space-y-1">
            <p>
              <span className="text-foreground font-medium">
                {result.feedbacks_created}
              </span>{" "}
              feedback dibuat
            </p>
            <p>
              <span className="text-foreground font-medium">
                {result.feedbacks_skipped}
              </span>{" "}
              duplikat di-skip
            </p>
            {result.auto_analyze_triggered && (
              <p className="text-info">
                ✓ Auto-analyze akan berjalan via Inngest
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
