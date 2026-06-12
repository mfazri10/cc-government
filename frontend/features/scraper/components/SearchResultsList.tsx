"use client";

import { useState } from "react";
import { CheckSquare, Square, DownloadCloud, Loader2, ExternalLink } from "lucide-react";
import { useScraperStore } from "@/store/scraperStore";
import { ingestSearchResults } from "@/features/scraper/actions";
import { toast } from "react-hot-toast";
import { formatDateTime } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SearchResultsList() {
  const { searchResults: data, isSearchLoading: isLoading } = useScraperStore();
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isIngesting, setIsIngesting] = useState(false);

  if (isLoading) {
    return (
      <Card glass className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted">Mencari informasi di seluruh jaringan...</p>
      </Card>
    );
  }

  if (!data || data.results.length === 0) {
    if (!data) return null;
    return (
      <Card glass className="flex flex-col items-center justify-center py-16">
        <p className="text-muted">Tidak ada hasil ditemukan untuk "{data.query}".</p>
      </Card>
    );
  }

  const handleSelectAll = () => {
    if (selectedUrls.size === data.results.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(data.results.map((r) => r.url)));
    }
  };

  const toggleSelect = (url: string) => {
    const newSet = new Set(selectedUrls);
    if (newSet.has(url)) newSet.delete(url);
    else newSet.add(url);
    setSelectedUrls(newSet);
  };

  const handleIngest = async () => {
    if (selectedUrls.size === 0) {
      toast.error("Pilih minimal satu hasil untuk disimpan");
      return;
    }

    const itemsToIngest = data.results.filter((r) => selectedUrls.has(r.url));
    setIsIngesting(true);

    try {
      const res = await ingestSearchResults(itemsToIngest);
      toast.success(res.message || `Berhasil menyimpan data pencarian`);
      setSelectedUrls(new Set());
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan hasil pencarian");
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <Card glass className="shadow-sm overflow-hidden">
      <div className="p-4 border-b border-card-border flex items-center justify-between bg-muted/20">
        <div>
          <h3 className="font-semibold">Hasil Pencarian: "{data.query}"</h3>
          <p className="text-xs text-muted">{data.results.length} item ditemukan</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleSelectAll}
            className="text-sm font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {selectedUrls.size === data.results.length ? "Batal Pilih Semua" : "Pilih Semua"}
          </Button>
          <Button
            onClick={handleIngest}
            disabled={isIngesting || selectedUrls.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success/80 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer border-transparent"
          >
            {isIngesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <DownloadCloud className="w-4 h-4" />
            )}
            Simpan & Ingest ({selectedUrls.size})
          </Button>
        </div>
      </div>

      <div className="divide-y divide-card-border">
        {data.results.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 flex gap-4 transition-colors ${
              selectedUrls.has(item.url) ? "bg-primary/5" : "hover:bg-card-hover/30"
            }`}
          >
            <div className="pt-1 cursor-pointer" onClick={() => toggleSelect(item.url)}>
              {selectedUrls.has(item.url) ? (
                <CheckSquare className="w-5 h-5 text-primary" />
              ) : (
                <Square className="w-5 h-5 text-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary font-semibold hover:underline text-lg flex items-center gap-2"
              >
                {item.title}
                <ExternalLink className="w-3 h-3 text-muted" />
              </a>
              <p className="text-xs text-positive-light mt-1 mb-2 truncate">{item.url}</p>
              <p className="text-sm text-foreground/80 line-clamp-2">{item.snippet}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-muted/50 border border-card-border">
                  {item.source}
                </span>
                {item.published_at && (
                  <span className="text-xs text-muted">
                    {formatDateTime(item.published_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
