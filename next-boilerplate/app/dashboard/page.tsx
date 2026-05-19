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
import type { DashboardOverview } from "@/types";

// Mock data — akan diganti dengan fetchDashboardOverview() saat backend ready
const mockData: DashboardOverview = {
  sentiment_summary: { positive: 120, negative: 85, neutral: 45, total: 250 },
  top_issues: [
    { topic: "Jalan Berlubang", count: 34 },
    { topic: "Antrian Panjang", count: 28 },
    { topic: "Sampah Menumpuk", count: 22 },
    { topic: "Lampu Mati", count: 18 },
    { topic: "AC Rusak", count: 15 },
    { topic: "Pelayanan Lambat", count: 12 },
    { topic: "Banjir", count: 10 },
    { topic: "Kemacetan", count: 8 },
  ],
  total_feedbacks: 250,
  total_unprocessed: 12,
  total_needs_attention: 7,
};

export default function DashboardPage() {
  const data = mockData;

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
          trend="up"
          trendValue="12% dari minggu lalu"
        />
        <StatCard
          title="Positif"
          value={formatNumber(data.sentiment_summary.positive)}
          subtitle={`${Math.round((data.sentiment_summary.positive / data.total_feedbacks) * 100)}% dari total`}
          icon={ThumbsUp}
          variant="positive"
          trend="up"
          trendValue="8%"
        />
        <StatCard
          title="Negatif"
          value={formatNumber(data.sentiment_summary.negative)}
          subtitle={`${Math.round((data.sentiment_summary.negative / data.total_feedbacks) * 100)}% dari total`}
          icon={ThumbsDown}
          variant="negative"
          trend="down"
          trendValue="5%"
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
