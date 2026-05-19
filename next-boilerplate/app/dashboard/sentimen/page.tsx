import SentimentPieChart from "@/components/charts/SentimentPieChart";
import TopIssuesBarChart from "@/components/charts/TopIssuesBarChart";
import type { SentimentSummary, TopIssue } from "@/types";

// Mock data
const mockSentiment: SentimentSummary = {
  positive: 120,
  negative: 85,
  neutral: 45,
  total: 250,
};

const mockIssues: TopIssue[] = [
  { topic: "Jalan Berlubang", count: 34 },
  { topic: "Antrian Panjang", count: 28 },
  { topic: "Sampah Menumpuk", count: 22 },
  { topic: "Lampu Jalan Mati", count: 18 },
  { topic: "AC Rusak", count: 15 },
  { topic: "Pelayanan Lambat", count: 12 },
  { topic: "Banjir", count: 10 },
  { topic: "Kemacetan", count: 8 },
  { topic: "Pungli", count: 6 },
  { topic: "Petugas Kasar", count: 4 },
];

export default function SentimenPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sentimen Analytics</h1>
          <p className="text-sm text-muted mt-1">
            Analisis sentimen publik — distribusi, tren, dan isu teratas
          </p>
        </div>
        <select className="px-3 py-2 rounded-xl bg-card border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50">
          <option value="7">7 Hari</option>
          <option value="30" selected>30 Hari</option>
          <option value="90">90 Hari</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-positive">{mockSentiment.positive}</p>
          <p className="text-xs text-muted mt-1">Positif ({Math.round((mockSentiment.positive / mockSentiment.total) * 100)}%)</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-negative">{mockSentiment.negative}</p>
          <p className="text-xs text-muted mt-1">Negatif ({Math.round((mockSentiment.negative / mockSentiment.total) * 100)}%)</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-muted">{mockSentiment.neutral}</p>
          <p className="text-xs text-muted mt-1">Netral ({Math.round((mockSentiment.neutral / mockSentiment.total) * 100)}%)</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SentimentPieChart data={mockSentiment} />
        <TopIssuesBarChart data={mockIssues} />
      </div>
    </div>
  );
}
