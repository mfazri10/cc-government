import { BellRing, Send, AlertTriangle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatDateTime } from "@/utils/format";

const mockAlertLogs = [
  { 
    id: 1, 
    created_at: "2024-11-20T14:30:00Z", 
    entity_name: "DPUPR Cimahi", 
    trigger_reason: "Lonjakan 210% keluhan 'Jalan Berlubang' dalam 2 jam terakhir.",
    status: "SENT",
    telegram_username: "@kadis_dpupr"
  },
  { 
    id: 2, 
    created_at: "2024-11-19T09:15:00Z", 
    entity_name: "RSUD Cibabat", 
    trigger_reason: "Terdeteksi 15+ keluhan antrian loket BPJS dalam waktu 1 jam.",
    status: "SENT",
    telegram_username: "@humas_rsud_cibabat"
  },
  { 
    id: 3, 
    created_at: "2024-11-18T16:00:00Z", 
    entity_name: "DLHK Cimahi", 
    trigger_reason: "Kata kunci 'Sampah Menumpuk' viral (tersebar di IG dan Twitter).",
    status: "FAILED",
    telegram_username: "@kadis_dlhk (Bot Blocked)"
  },
];

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BellRing className="w-5 h-5 text-accent-light" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Early Warning System (EWS) Logs</h1>
          <p className="text-sm text-muted mt-1">Riwayat notifikasi peringatan dini yang dikirim ke Telegram PIC OPD</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Waktu</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Target / OPD</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Alasan Trigger (Anomaly)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Penerima (Telegram)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {mockAlertLogs.map((log) => (
              <tr key={log.id} className="hover:bg-card-hover transition-smooth">
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                  {formatDateTime(log.created_at)}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {log.entity_name}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{log.trigger_reason}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted text-xs font-mono">
                  {log.telegram_username}
                </td>
                <td className="px-4 py-3">
                  {log.status === "SENT" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-positive-bg text-positive text-xs font-medium">
                      <Send className="w-3 h-3" /> Terkirim
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-negative-bg text-negative text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" /> Gagal
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
