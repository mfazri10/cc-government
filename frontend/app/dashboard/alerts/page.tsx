import { BellRing, Send, AlertTriangle, Settings } from "lucide-react";
import { formatDateTime } from "@/utils/format";
import { fetchAlertLogs, fetchAlertConfig } from "./actions";

export default async function AlertsPage() {
  let logs: any[] = [];
  let config: any = {};

  try {
    const [logsData, configData] = await Promise.all([
      fetchAlertLogs(),
      fetchAlertConfig(),
    ]);
    logs = logsData.logs || [];
    config = configData;
  } catch {
    // Fallback to empty state
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BellRing className="w-5 h-5 text-accent-light" />
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Early Warning System (EWS)
          </h1>
          <p className="text-sm text-muted mt-1">
            Riwayat notifikasi peringatan dini yang dikirim
          </p>
        </div>
      </div>

      {/* Alert Config Status */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-muted" />
          <h3 className="font-semibold text-sm">Konfigurasi Alert</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                config.configured_channels?.includes("telegram")
                  ? "bg-positive"
                  : "bg-muted"
              }`}
            />
            <span className="text-sm">Telegram</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                config.configured_channels?.includes("webhook")
                  ? "bg-positive"
                  : "bg-muted"
              }`}
            />
            <span className="text-sm">Webhook</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                config.configured_channels?.includes("email")
                  ? "bg-positive"
                  : "bg-muted"
              }`}
            />
            <span className="text-sm">Email</span>
          </div>
        </div>
      </div>

      {/* Alert Logs */}
      <div className="glass-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <BellRing className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-foreground font-medium">
              Belum ada alert yang dikirim
            </p>
            <p className="text-sm text-muted mt-1">
              Alert akan muncul ketika feedback membutuhkan perhatian
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Waktu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Channel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Subjek
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {logs.map((log: any) => (
                <tr
                  key={log.id}
                  className="hover:bg-card-hover transition-smooth"
                >
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-info-bg text-info text-xs font-medium capitalize">
                      {log.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{log.subject}</td>
                  <td className="px-4 py-3">
                    {log.success ? (
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
        )}
      </div>
    </div>
  );
}
