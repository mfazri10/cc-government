import { Database, Play, Plus, RefreshCw } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatDateTime } from "@/utils/format";

const mockSources = [
  { 
    id: 1, 
    platform: "Google Maps", 
    name: "RSUD Cibabat Reviews", 
    url: "https://maps.google.com/?cid=12345", 
    entity: "RSUD Cibabat",
    status: "active",
    last_scraped_at: "2024-11-20T12:00:00Z"
  },
  { 
    id: 2, 
    platform: "Twitter", 
    name: "Keyword: 'Macet Cimahi'", 
    url: "#", 
    entity: "Dishub Cimahi",
    status: "active",
    last_scraped_at: "2024-11-20T11:45:00Z"
  },
  { 
    id: 3, 
    platform: "Instagram", 
    name: "@pemkotcimahi", 
    url: "https://instagram.com/pemkotcimahi", 
    entity: "Pemkot",
    status: "error",
    last_scraped_at: "2024-11-19T08:00:00Z"
  },
];

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-accent-light" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Source & Ingestion Manager</h1>
            <p className="text-sm text-muted mt-1">Kelola sumber data *scraping* dan pipeline Inngest</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-card-border bg-card text-foreground text-sm font-medium hover:bg-card-hover transition-smooth">
            <RefreshCw className="w-4 h-4 text-muted" /> Sync Jobs
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-smooth">
            <Plus className="w-4 h-4" /> Tambah Source
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Platform</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Nama/URL</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Target Entity</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Terakhir Scrape</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {mockSources.map((s) => (
              <tr key={s.id} className="hover:bg-card-hover transition-smooth">
                <td className="px-4 py-3 font-medium text-foreground">{s.platform}</td>
                <td className="px-4 py-3">
                  <p className="text-foreground">{s.name}</p>
                  {s.url !== "#" && (
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-accent-light hover:underline">
                      {s.url}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{s.entity}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.status === "active" ? "positive" : "negative"}>
                    {s.status === "active" ? "Aktif" : "Error"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {formatDateTime(s.last_scraped_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent-light text-xs font-medium hover:bg-accent/20 transition-smooth"
                    title="Manual Trigger via Inngest"
                  >
                    <Play className="w-3.5 h-3.5" /> Scrape Now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
