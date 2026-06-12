"use client";

import { cn } from "@/utils/cn";
import { formatDateTime, truncate } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { FeedbackWithAnalysis, Sentiment } from "@/types";

interface FeedbackTableProps {
  feedbacks: FeedbackWithAnalysis[];
  isLoading?: boolean;
}

function sentimentVariant(s: Sentiment | null): "positive" | "negative" | "neutral" {
  if (s === "POSITIVE") return "positive";
  if (s === "NEGATIVE") return "negative";
  return "neutral";
}

function sentimentLabel(s: Sentiment | null): string {
  if (s === "POSITIVE") return "Positif";
  if (s === "NEGATIVE") return "Negatif";
  return "Netral";
}

export default function FeedbackTable({ feedbacks, isLoading }: FeedbackTableProps) {
  if (isLoading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted text-sm">
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          Memuat data...
        </div>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-muted text-sm">Belum ada feedback.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                Konten
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                Sentimen
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                Emosi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                Topik
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                Sumber
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                Waktu
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {feedbacks.map((fb) => (
              <tr
                key={fb.id}
                className={cn(
                  "hover:bg-card-hover transition-smooth cursor-pointer",
                  fb.needs_attention && "border-l-2 border-l-warning"
                )}
              >
                <td className="px-4 py-3 max-w-xs">
                  <div className="flex items-start gap-2">
                    {fb.needs_attention && (
                      <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-foreground leading-snug">
                        {truncate(fb.content, 100)}
                      </p>
                      {fb.author_name && (
                        <p className="text-xs text-muted mt-1">
                          oleh {fb.author_name}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={sentimentVariant(fb.sentiment)}>
                    {sentimentLabel(fb.sentiment)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted text-xs">
                  {fb.emotion || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {fb.topics?.slice(0, 2).map((topic) => (
                      <Badge key={topic} variant="default" size="sm">
                        {topic}
                      </Badge>
                    ))}
                    {(fb.topics?.length ?? 0) > 2 && (
                      <Badge variant="default" size="sm">
                        +{(fb.topics?.length ?? 0) - 2}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                  {fb.source_name || "-"}
                </td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                  {formatDateTime(fb.scraped_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
