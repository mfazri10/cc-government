"use client";

import { Search, Loader2 } from "lucide-react";
import { useScraperStore } from "@/store/scraperStore";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AVAILABLE_SOURCES = ["Web Search", "Berita Lokal", "Twitter / X", "Instagram"];

export default function SearchForm() {
  const {
    searchQuery,
    searchSources,
    isSearchLoading,
    setSearchQuery,
    setSearchSources,
    executeSearch,
  } = useScraperStore();

  const toggleSource = (source: string) => {
    if (searchSources.includes(source)) {
      setSearchSources(searchSources.filter((s) => s !== source));
    } else {
      setSearchSources([...searchSources, source]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Masukkan kata kunci pencarian");
      return;
    }
    if (searchSources.length === 0) {
      toast.error("Pilih minimal satu sumber pencarian");
      return;
    }

    try {
      await executeSearch(searchQuery, searchSources, 15);
      toast.success("Pencarian selesai dilakukan");
    } catch (error: any) {
      toast.error(error.message || "Gagal melakukan pencarian");
    }
  };

  return (
    <Card glass className="p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Discover & Pencarian Global</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-muted">Kata Kunci (Query)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted" />
            </div>
            <Input
              type="text"
              className="pl-10 pr-4 bg-background/40"
              placeholder="Contoh: banjir cimahi, perbaikan jalan raya"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearchLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-muted">Sumber Pencarian (Target)</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SOURCES.map((source) => {
              const isSelected = searchSources.includes(source);
              return (
                <Button
                  key={source}
                  type="button"
                  onClick={() => toggleSource(source)}
                  disabled={isSearchLoading}
                  variant={isSelected ? "default" : "outline"}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-smooth border cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 text-primary border-primary hover:bg-primary/20"
                      : "bg-card text-muted border-card-border hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {source}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSearchLoading}
            className="flex items-center gap-2 px-6 py-3 gradient-accent text-white rounded-lg font-semibold hover:opacity-90 cursor-pointer border-transparent"
          >
            {isSearchLoading ? (
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
          </Button>
        </div>
      </form>
    </Card>
  );
}
