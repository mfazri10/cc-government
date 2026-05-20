import { Suspense } from "react";
import FeedbackTable from "@/features/feedbacks/components/FeedbackTable";
import FeedbackFilters from "@/features/feedbacks/components/FeedbackFilters";
import Pagination from "@/features/feedbacks/components/Pagination";
import { fetchFeedbacks } from "@/features/feedbacks/actions";
import { fetchTargetEntities } from "@/features/target-entities/actions";
import { AlertTriangle } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    sentiment?: string;
    entity_id?: string;
  }>;
}

export default async function FeedbacksPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const sentiment = resolvedParams.sentiment || undefined;
  const entity_id = resolvedParams.entity_id
    ? parseInt(resolvedParams.entity_id, 10)
    : undefined;

  let feedbackData;
  let entities;

  try {
    [feedbackData, entities] = await Promise.all([
      fetchFeedbacks({ page, page_size: 20, sentiment, entity_id }),
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
      <div>
        <h1 className="text-xl font-bold text-foreground">Feedback Explorer</h1>
        <p className="text-sm text-muted mt-1">
          Semua ulasan dan komentar warga yang telah dianalisis AI
        </p>
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
