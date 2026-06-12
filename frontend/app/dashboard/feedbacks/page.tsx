import { Suspense } from "react";
import { Download } from "lucide-react";
import FeedbackTable from "@/features/feedbacks/components/FeedbackTable";
import FeedbackFilters from "@/features/feedbacks/components/FeedbackFilters";
import Pagination from "@/features/feedbacks/components/Pagination";
import { fetchFeedbacks } from "@/features/feedbacks/actions";
import { fetchTargetEntities } from "@/features/target-entities/actions";
import { AlertTriangle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    sentiment?: string;
    entity_id?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  }>;
}

export default async function FeedbacksPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const sentiment = resolvedParams.sentiment || undefined;
  const entity_id = resolvedParams.entity_id
    ? parseInt(resolvedParams.entity_id, 10)
    : undefined;
  const search = resolvedParams.search || undefined;
  const start_date = resolvedParams.start_date || undefined;
  const end_date = resolvedParams.end_date || undefined;

  let feedbackData;
  let entities;

  try {
    [feedbackData, entities] = await Promise.all([
      fetchFeedbacks({
        page,
        page_size: 20,
        sentiment,
        entity_id,
        search,
        start_date,
        end_date,
      }),
      fetchTargetEntities(),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Feedback Explorer</h1>
          <p className="text-sm text-muted mt-1">
            Semua ulasan dan komentar warga yang telah dianalisis AI
          </p>
        </div>
        <div className="glass-card p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
          <p className="text-foreground font-medium">Gagal memuat data feedback</p>
          <p className="text-sm text-muted mt-1">Pastikan backend API berjalan di port 8000.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Feedback Explorer</h1>
          <p className="text-sm text-muted mt-1">
            Semua ulasan dan komentar warga yang telah dianalisis AI
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <a
            href={`${API_URL}/api/v1/export/csv?${new URLSearchParams({
              ...(sentiment && { sentiment }),
              ...(entity_id && { entity_id: String(entity_id) }),
              ...(search && { search }),
              ...(start_date && { start_date }),
              ...(end_date && { end_date }),
            }).toString()}`}
            download
            className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground border rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </a>
          <a
            href={`${API_URL}/api/v1/export/excel?${new URLSearchParams({
              ...(sentiment && { sentiment }),
              ...(entity_id && { entity_id: String(entity_id) }),
              ...(search && { search }),
              ...(start_date && { start_date }),
              ...(end_date && { end_date }),
            }).toString()}`}
            download
            className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground border rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <Suspense fallback={null}>
        <FeedbackFilters entities={entities} />
      </Suspense>

      {/* Table */}
      <FeedbackTable feedbacks={feedbackData.data} />

      {/* Pagination */}
      <Suspense fallback={null}>
        <Pagination
          page={feedbackData.page}
          totalPages={feedbackData.total_pages}
          total={feedbackData.total}
        />
      </Suspense>
    </div>
  );
}
