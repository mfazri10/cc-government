import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
} from "lucide-react";
import { formatNumber } from "@/utils/format";
import StatCard from "@/features/dashboard/components/StatCard";
import SentimentPieChart from "@/components/charts/SentimentPieChart";
import TopIssuesBarChart from "@/components/charts/TopIssuesBarChart";
import { fetchDashboardOverview } from "@/features/dashboard/actions";

export default async function DashboardPage() {
  let data;

  try {
    data = await fetchDashboardOverview(30);
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted mt-1">
            Ringkasan sentimen publik Kota Cimahi — 30 hari terakhir
          </p>
        </div>
        <div className="glass-card p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
          <p className="text-foreground font-medium">Gagal memuat data dashboard</p>
          <p className="text-sm text-muted mt-1">Pastikan backend API berjalan di port 8000.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-sm text-muted mt-1">
          Ringkasan sentimen publik Kota Cimahi — 30 hari terakhir
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Feedback"
          value={formatNumber(data.total_feedbacks)}
          subtitle={`${data.total_unprocessed} belum diproses`}
          icon={MessageSquare}
          variant="default"
        />
        <StatCard
          title="Positif"
          value={formatNumber(data.sentiment_summary.positive)}
          subtitle={`${data.total_feedbacks > 0 ? Math.round((data.sentiment_summary.positive / data.total_feedbacks) * 100) : 0}% dari total`}
          icon={ThumbsUp}
          variant="positive"
        />
        <StatCard
          title="Negatif"
          value={formatNumber(data.sentiment_summary.negative)}
          subtitle={`${data.total_feedbacks > 0 ? Math.round((data.sentiment_summary.negative / data.total_feedbacks) * 100) : 0}% dari total`}
          icon={ThumbsDown}
          variant="negative"
        />
        <StatCard
          title="Perlu Perhatian"
          value={formatNumber(data.total_needs_attention)}
          subtitle="Urgensi tinggi"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SentimentPieChart data={data.sentiment_summary} />
        <TopIssuesBarChart data={data.top_issues} />
      </div>
    </div>
  );
}
