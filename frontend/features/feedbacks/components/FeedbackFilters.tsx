"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { TargetEntity } from "@/types";

interface FeedbackFiltersProps {
  entities: TargetEntity[];
}

export default function FeedbackFilters({ entities }: FeedbackFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSentiment = searchParams.get("sentiment") || "";
  const currentEntityId = searchParams.get("entity_id") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentStartDate = searchParams.get("start_date") || "";
  const currentEndDate = searchParams.get("end_date") || "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <input
        type="text"
        placeholder="Cari feedback..."
        value={currentSearch}
        onChange={(e) => updateFilter("search", e.target.value)}
        className="px-3 py-2 rounded-xl bg-card border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 transition-smooth w-64"
      />

      {/* Sentiment Filter */}
      <select
        value={currentSentiment}
        onChange={(e) => updateFilter("sentiment", e.target.value)}
        className="px-3 py-2 rounded-xl bg-card border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 transition-smooth cursor-pointer"
      >
        <option value="">Semua Sentimen</option>
        <option value="POSITIVE">Positif</option>
        <option value="NEGATIVE">Negatif</option>
        <option value="NEUTRAL">Netral</option>
      </select>

      {/* Entity Filter */}
      <select
        value={currentEntityId}
        onChange={(e) => updateFilter("entity_id", e.target.value)}
        className="px-3 py-2 rounded-xl bg-card border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 transition-smooth cursor-pointer"
      >
        <option value="">Semua OPD</option>
        {entities.map((e) => (
          <option key={e.id} value={String(e.id)}>
            {e.name}
          </option>
        ))}
      </select>

      {/* Date Range */}
      <input
        type="date"
        value={currentStartDate}
        onChange={(e) => updateFilter("start_date", e.target.value)}
        className="px-3 py-2 rounded-xl bg-card border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 transition-smooth"
        title="Tanggal mulai"
      />
      <span className="text-muted text-sm">-</span>
      <input
        type="date"
        value={currentEndDate}
        onChange={(e) => updateFilter("end_date", e.target.value)}
        className="px-3 py-2 rounded-xl bg-card border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 transition-smooth"
        title="Tanggal akhir"
      />
    </div>
  );
}
