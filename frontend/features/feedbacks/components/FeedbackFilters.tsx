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

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset ke halaman 1 saat filter berubah
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
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
    </div>
  );
}
