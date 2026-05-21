"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { performSearch } from "@/features/scraper/actions";
import type { SearchQueryResponse } from "@/types";
import { toast } from "react-hot-toast";

interface SearchFormProps {
  onResults: (results: SearchQueryResponse) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

const AVAILABLE_SOURCES = ["Web Search", "Berita Lokal", "Twitter / X", "Instagram"];

export default function SearchForm({ onResults, onLoadingChange }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(["Web Search", "Berita Lokal"]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSource = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Masukkan kata kunci pencarian");
      return;
    }
    if (selectedSources.length === 0) {
      toast.error("Pilih minimal satu sumber pencarian");
      return;
    }

    setIsLoading(true);
    onLoadingChange(true);
    
    try {
      const response = await performSearch(query, selectedSources, 15);
      onResults(response);
      toast.success(`Ditemukan ${response.results.length} hasil pencarian`);
    } catch (error: any) {
      toast.error(error.message || "Gagal melakukan pencarian");
    } finally {
      setIsLoading(false);
      onLoadingChange(false);
    }
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6 shadow-sm mb-6">
      <h2 className="text-xl font-bold mb-4">Discover & Pencarian Global</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kata Kunci (Query)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full bg-body-bg border border-card-border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              placeholder="Contoh: banjir cimahi, perbaikan jalan raya"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sumber Pencarian (Target)</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SOURCES.map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => toggleSource(source)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                  selectedSources.includes(source)
                    ? "bg-primary-500/10 text-primary-500 border-primary-500"
                    : "bg-body-bg text-gray-400 border-card-border hover:border-gray-500 hover:text-gray-300"
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mencari...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Cari Sekarang
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
