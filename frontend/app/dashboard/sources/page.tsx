"use client";

import { useEffect, useState } from "react";
import { Database, Play, Plus, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatDateTime } from "@/utils/format";
import { fetchDataSources, triggerManualScrape } from "@/features/sources/actions";
import type { DataSource } from "@/types";
import { toast } from "react-hot-toast";

export default function SourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDataSources();
      setSources(data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat sumber data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerScrape = async (id: number, name: string) => {
    setTriggeringId(id);
    try {
      const res = await triggerManualScrape(id);
      toast.success(res.message || `Scrape dipicu untuk ${name}`);
      await loadData(); // Reload data untuk update status/waktu
    } catch (err: any) {
      toast.error(err.message || `Gagal memicu scrape untuk ${name}`);
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Source & Ingestion Manager</h1>
            <p className="text-sm text-muted mt-1">Kelola sumber data dan jadwal otomatis scraping</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-card-border bg-card text-foreground text-sm font-medium hover:bg-card-hover transition-smooth disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-muted ${isLoading ? "animate-spin" : ""}`} /> Sync
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-smooth">
            <Plus className="w-4 h-4" /> Tambah Source
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
            <p className="text-muted">Memuat data sumber...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-8 h-8 text-negative-500 mb-4" />
            <p className="text-negative-500 font-medium">{error}</p>
            <button onClick={loadData} className="mt-4 text-primary-500 text-sm hover:underline">
              Coba Lagi
            </button>
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Database className="w-8 h-8 text-muted mb-4 opacity-50" />
            <p className="text-muted font-medium">Belum ada sumber data yang dikonfigurasi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-card-hover transition-smooth">
                    <td className="px-4 py-3 font-medium text-foreground">{s.source_name}</td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{s.name}</p>
                      {s.url && s.url !== "#" && (
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-accent-light hover:underline">
                          {s.url}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{s.target_entity_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === "active" ? "positive" : "negative"}>
                        {s.status === "active" ? "Aktif" : "Error"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {s.last_scraped_at ? formatDateTime(s.last_scraped_at) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleTriggerScrape(s.id, s.name)}
                        disabled={triggeringId === s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent-light text-xs font-medium hover:bg-accent/20 transition-smooth disabled:opacity-50"
                        title="Manual Trigger via Inngest"
                      >
                        {triggeringId === s.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" /> 
                        )}
                        Scrape Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
