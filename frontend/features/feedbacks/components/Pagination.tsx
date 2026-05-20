"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export default function Pagination({ page, totalPages, total }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (targetPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    router.push(`?${params.toString()}`);
  };

  // Generate page numbers to show
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-muted">
        Total <span className="font-semibold text-foreground">{total}</span> feedback
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-smooth"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={cn(
              "w-8 h-8 rounded-lg text-xs font-medium transition-smooth",
              p === page
                ? "gradient-accent text-white shadow-lg shadow-accent/20"
                : "text-muted hover:text-foreground hover:bg-card-hover"
            )}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-smooth"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
