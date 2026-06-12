"use client";

import { useState } from "react";
import { Database, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { ingestScrapeResults } from "@/features/scraper/actions";
import type { IngestResult, TargetEntity } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
  const [sourceId, setSourceId] = useState<string>(String(sources[0]?.id || 0));
  const [entityId, setEntityId] = useState<string>("");
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isIngested, setIsIngested] = useState(initialIngested);
  const [ingestCount, setIngestCount] = useState(initialCount);

  const handleIngest = async () => {
    if (!sourceId || sourceId === "0") return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await ingestScrapeResults(
        jobId,
        Number(sourceId),
        entityId ? Number(entityId) : undefined,
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
      <Badge variant="positive" className="gap-1.5">
        <CheckCircle2 className="w-3 h-3" />
        Ingested ({ingestCount} feedback)
      </Badge>
    );
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="gap-1.5 bg-info/10 border-transparent text-info hover:bg-info/20 cursor-pointer font-medium"
        >
          <Database className="w-3 h-3" />
          Ingest to Pipeline
        </Button>
      )}

      {/* Ingest Form */}
      {isOpen && !result && (
        <Card className="p-4 space-y-3 border-info/20 min-w-[300px]">
          <p className="text-xs font-semibold text-foreground">
            Ingest ke Pipeline Sentimen
          </p>

          {/* Source Select */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted uppercase tracking-wider font-medium">
              Source
            </label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger className="w-full text-sm h-9">
                <SelectValue placeholder="Pilih source" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Select */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted uppercase tracking-wider font-medium">
              Target Entity (opsional)
            </label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger className="w-full text-sm h-9">
                <SelectValue placeholder="— Tidak ada —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Tidak ada —</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button
              onClick={handleIngest}
              disabled={isLoading || !sourceId || sourceId === "0"}
              className="flex-1 gap-2 gradient-accent text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 cursor-pointer border-transparent"
              size="sm"
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
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              Batal
            </Button>
          </div>
        </Card>
      )}

      {/* Success Result */}
      {result && (
        <Card className="p-4 space-y-2 border-positive/20 min-w-[280px]">
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
        </Card>
      )}
    </div>
  );
}
