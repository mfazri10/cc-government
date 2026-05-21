"use client";

import { useState } from "react";
import { CheckSquare, Square, DownloadCloud, Loader2, ExternalLink } from "lucide-react";
import type { SearchQueryResponse, SearchQueryResultItem } from "@/types";
import { ingestSearchResults } from "@/features/scraper/actions";
import { toast } from "react-hot-toast";
import { formatDateTime } from "@/utils/format";

interface SearchResultsListProps {
  data: SearchQueryResponse | null;
  isLoading: boolean;
}

export default function SearchResultsList({ data, isLoading }: SearchResultsListProps) {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isIngesting, setIsIngesting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-card-bg border border-card-border rounded-xl">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
        <p className="text-gray-400">Mencari informasi di seluruh jaringan...</p>
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    if (!data) return null;
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-card-bg border border-card-border rounded-xl">
        <p className="text-gray-400">Tidak ada hasil ditemukan untuk "{data.query}".</p>
      </div>
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
      // Untuk MVP kita bisa buat targetEntityId undefined (atau tambah dropdown filter jika perlu)
      const res = await ingestSearchResults(itemsToIngest);
      toast.success(res.message || `Berhasil menyimpan data pencarian`);
      // Reset seleksi setelah berhasil
      setSelectedUrls(new Set());
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan hasil pencarian");
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-card-border flex items-center justify-between bg-body-bg/50">
        <div>
          <h3 className="font-semibold">Hasil Pencarian: "{data.query}"</h3>
          <p className="text-xs text-gray-400">{data.results.length} item ditemukan</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
          >
            {selectedUrls.size === data.results.length ? "Batal Pilih Semua" : "Pilih Semua"}
          </button>
          <button
            onClick={handleIngest}
            disabled={isIngesting || selectedUrls.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isIngesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <DownloadCloud className="w-4 h-4" />
            )}
            Simpan & Ingest ({selectedUrls.size})
          </button>
        </div>
      </div>

      <div className="divide-y divide-card-border">
        {data.results.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 flex gap-4 transition-colors ${
              selectedUrls.has(item.url) ? "bg-primary-500/5" : "hover:bg-body-bg"
            }`}
          >
            <div className="pt-1 cursor-pointer" onClick={() => toggleSelect(item.url)}>
              {selectedUrls.has(item.url) ? (
                <CheckSquare className="w-5 h-5 text-primary-500" />
              ) : (
                <Square className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary-400 font-medium hover:underline text-lg flex items-center gap-2"
              >
                {item.title}
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </a>
              <p className="text-xs text-success-500 mt-1 mb-2 truncate">{item.url}</p>
              <p className="text-sm text-gray-300 line-clamp-2">{item.snippet}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-body-bg border border-card-border">
                  {item.source}
                </span>
                {item.published_at && (
                  <span className="text-xs text-gray-500">
                    {formatDateTime(item.published_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
