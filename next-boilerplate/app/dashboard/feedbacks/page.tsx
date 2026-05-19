import FeedbackTable from "@/features/feedbacks/components/FeedbackTable";
import type { FeedbackWithAnalysis } from "@/types";

// Mock data — akan diganti fetchFeedbacks() saat backend ready
const mockFeedbacks: FeedbackWithAnalysis[] = [
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
    id: "2",
    content: "Pelayanan KTP di Disdukcapil hari ini cepat, cuma 15 menit. Terima kasih Pak Lurah!",
    author_name: "Siti N.",
    url: null,
    posted_at: "2024-11-19T09:00:00Z",
    scraped_at: "2024-11-19T11:00:00Z",
    source_name: "Twitter",
    target_entity_name: "Disdukcapil Cimahi",
    sentiment: "POSITIVE",
    emotion: "Apresiasi",
    topics: ["Pelayanan Cepat", "KTP"],
    needs_attention: false,
  },
  {
    id: "3",
    content: "Sampah di gang belakang RSUD menumpuk sudah seminggu, bau sangat menyengat. Warga sekitar sudah komplen ke RT tapi tidak ada tindakan.",
    author_name: "Budi S.",
    url: null,
    posted_at: "2024-11-18T14:20:00Z",
    scraped_at: "2024-11-18T16:00:00Z",
    source_name: "Instagram",
    target_entity_name: "DLHK Cimahi",
    sentiment: "NEGATIVE",
    emotion: "Marah",
    topics: ["Sampah Menumpuk", "Kebersihan", "Lingkungan"],
    needs_attention: true,
  },
  {
    id: "4",
    content: "Puskesmas Cipageran sekarang bagus, ada AC, ruang tunggu nyaman. Mantap 👍",
    author_name: "Rina W.",
    url: null,
    posted_at: "2024-11-17T08:45:00Z",
    scraped_at: "2024-11-17T10:00:00Z",
    source_name: "Google Maps",
    target_entity_name: "Puskesmas Cipageran",
    sentiment: "POSITIVE",
    emotion: "Apresiasi",
    topics: ["Fasilitas Bagus"],
    needs_attention: false,
  },
  {
    id: "5",
    content: "Antrian BPJS di RSUD Cibabat sangat panjang, mulai jam 5 pagi sudah ramai. Tolong tambah loket.",
    author_name: "Dedi P.",
    url: null,
    posted_at: "2024-11-16T06:15:00Z",
    scraped_at: "2024-11-16T08:00:00Z",
    source_name: "Twitter",
    target_entity_name: "RSUD Cibabat",
    sentiment: "NEGATIVE",
    emotion: "Sedih",
    topics: ["Antrian Panjang", "BPJS", "Loket"],
    needs_attention: false,
  },
];

export default function FeedbacksPage() {
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
      <div className="flex flex-wrap items-center gap-3">
        <select className="px-3 py-2 rounded-xl bg-card border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50">
          <option value="">Semua Sentimen</option>
          <option value="POSITIVE">Positif</option>
          <option value="NEGATIVE">Negatif</option>
          <option value="NEUTRAL">Netral</option>
        </select>
        <select className="px-3 py-2 rounded-xl bg-card border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50">
          <option value="">Semua OPD</option>
          <option value="1">RSUD Cibabat</option>
          <option value="2">Disdukcapil</option>
          <option value="3">DPUPR</option>
          <option value="4">DLHK</option>
        </select>
      </div>

      {/* Table */}
      <FeedbackTable feedbacks={mockFeedbacks} />
    </div>
  );
}
