import { Building2 } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { fetchTargetEntities } from "@/features/target-entities/actions";

export default async function TargetEntitiesPage() {
  let entities;

  try {
    entities = await fetchTargetEntities();
  } catch {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-accent-light" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Target Entity</h1>
            <p className="text-sm text-muted mt-1">Kelola OPD dan fasilitas publik yang dipantau</p>
          </div>
        </div>
        <div className="glass-card p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
          <p className="text-foreground font-medium">Gagal memuat data entities</p>
          <p className="text-sm text-muted mt-1">Pastikan backend API berjalan di port 8000.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-accent-light" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Target Entity</h1>
            <p className="text-sm text-muted mt-1">Kelola OPD dan fasilitas publik yang dipantau</p>
          </div>
        </div>
      </div>

      {entities.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted text-sm">Belum ada target entity.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Keywords</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">PIC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {entities.map((e) => (
                <tr key={e.id} className="hover:bg-card-hover transition-smooth">
                  <td className="px-4 py-3 font-medium text-foreground">{e.name}</td>
                  <td className="px-4 py-3 text-muted">{e.entity_type}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {e.keywords?.map((k) => (
                        <span key={k} className="px-2 py-0.5 text-[11px] rounded-full bg-accent/10 text-accent-light">{k}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{e.pic_contact || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
