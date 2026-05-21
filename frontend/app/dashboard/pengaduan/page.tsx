import FeedbackTable from "@/features/feedbacks/components/FeedbackTable";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { FeedbackWithAnalysis } from "@/types";

// Mock — reuse dari feedbacks tapi hanya yang NEGATIVE
const mockPengaduan: FeedbackWithAnalysis[] = [
  {
    id: "1",
    content: "Jalan di depan Pasar Atas sudah berlubang parah, motor saya sempat jatuh. Sudah 3 bulan tidak diperbaiki!",
    author_name: "Ahmad R.",
    url: null,
    posted_at: "2024-11-20T10:30:00Z",
    scraped_at: "2024-11-20T12:00:00Z",
    source_name: "Google Maps",
    target_entity_name: "DPUPR Cimahi",
    sentiment: "NEGATIVE",
    emotion: "Marah",
    topics: ["Jalan Berlubang", "Infrastruktur"],
    needs_attention: true,
  },
  {
    id: "3",
    content: "Sampah di gang belakang RSUD menumpuk sudah seminggu, bau sangat menyengat.",
    author_name: "Budi S.",
    url: null,
    posted_at: "2024-11-18T14:20:00Z",
    scraped_at: "2024-11-18T16:00:00Z",
    source_name: "Instagram",
    target_entity_name: "DLHK Cimahi",
    sentiment: "NEGATIVE",
    emotion: "Marah",
    topics: ["Sampah Menumpuk", "Kebersihan"],
    needs_attention: true,
  },
];

export default function PengaduanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Pengaduan Intelligence</h1>
          <p className="text-sm text-muted mt-1">
            Keluhan warga yang membutuhkan perhatian segera
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="negative">{mockPengaduan.length} pengaduan aktif</Badge>
        <Badge variant="warning">{mockPengaduan.filter(f => f.needs_attention).length} butuh perhatian</Badge>
      </div>

      <FeedbackTable feedbacks={mockPengaduan} />
    </div>
  );
}
