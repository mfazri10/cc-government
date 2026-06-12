import { FileText, Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Laporan</h1>
        <p className="text-sm text-muted mt-1">
          Generate dan download laporan analisis sentimen
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Analytics Report */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-info" />
            </div>
            <div>
              <h3 className="font-semibold">Laporan Analitik</h3>
              <p className="text-xs text-muted">30 hari terakhir</p>
            </div>
          </div>
          <p className="text-sm text-muted mb-4">
            Ringkasan lengkap distribusi sentimen, top OPD, dan feedback yang
            butuh perhatian.
          </p>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/reports/analytics/pdf?days=30`}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
        </div>

        {/* Weekly Report */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-positive/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-positive" />
            </div>
            <div>
              <h3 className="font-semibold">Laporan Mingguan</h3>
              <p className="text-xs text-muted">7 hari terakhir</p>
            </div>
          </div>
          <p className="text-sm text-muted mb-4">
            Laporan singkat untuk evaluasi mingguan.
          </p>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/reports/analytics/pdf?days=7`}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
        </div>

        {/* Export Data */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold">Export Data</h3>
              <p className="text-xs text-muted">CSV / Excel</p>
            </div>
          </div>
          <p className="text-sm text-muted mb-4">
            Export data feedback untuk analisis lebih lanjut.
          </p>
          <div className="flex gap-2">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/export/csv`}
              download
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground border rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </a>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/export/excel`}
              download
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground border rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              <Download className="w-4 h-4" />
              Excel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
