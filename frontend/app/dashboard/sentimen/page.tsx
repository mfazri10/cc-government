import { Suspense } from "react";
import SentimentPieChart from "@/components/charts/SentimentPieChart";
import TopIssuesBarChart from "@/components/charts/TopIssuesBarChart";
import { fetchSentimentSummary, fetchTopIssues } from "@/features/dashboard/actions";
import DaysFilter from "@/features/dashboard/components/DaysFilter";
import { AlertTriangle } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function SentimenPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const days = resolvedParams.days ? parseInt(resolvedParams.days, 10) : 30;

  let sentiment;
  let issues;

  try {
    [sentiment, issues] = await Promise.all([
      fetchSentimentSummary(days),
      fetchTopIssues(days),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Sentimen Analytics</h1>
            <p className="text-sm text-muted mt-1">
              Analisis sentimen publik — distribusi, tren, dan isu teratas
            </p>
          </div>
          <Suspense fallback={null}>
            <DaysFilter />
          </Suspense>
        </div>
        <div className="glass-card p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
          <p className="text-foreground font-medium">Gagal memuat data sentimen</p>
          <p className="text-sm text-muted mt-1">Pastikan backend API berjalan di port 8000.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sentimen Analytics</h1>
          <p className="text-sm text-muted mt-1">
            Analisis sentimen publik — distribusi, tren, dan isu teratas ({days} hari terakhir)
          </p>
        </div>
        <Suspense fallback={null}>
          <DaysFilter />
        </Suspense>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-positive">{sentiment.positive}</p>
          <p className="text-xs text-muted mt-1">
            Positif ({sentiment.total > 0 ? Math.round((sentiment.positive / sentiment.total) * 100) : 0}%)
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-negative">{sentiment.negative}</p>
          <p className="text-xs text-muted mt-1">
            Negatif ({sentiment.total > 0 ? Math.round((sentiment.negative / sentiment.total) * 100) : 0}%)
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-muted">{sentiment.neutral}</p>
          <p className="text-xs text-muted mt-1">
            Netral ({sentiment.total > 0 ? Math.round((sentiment.neutral / sentiment.total) * 100) : 0}%)
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SentimentPieChart data={sentiment} />
        <TopIssuesBarChart data={issues} />
      </div>
    </div>
  );
}
