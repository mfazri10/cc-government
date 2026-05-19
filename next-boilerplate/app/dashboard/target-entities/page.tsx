import { Building2, Plus } from "lucide-react";

const mockEntities = [
  { id: 1, name: "RSUD Cibabat", entity_type: "Fasilitas_Kesehatan", keywords: ["rsud cibabat", "rs cibabat"], pic_contact: "+628123456789" },
  { id: 2, name: "Disdukcapil Cimahi", entity_type: "OPD", keywords: ["disdukcapil", "ktp cimahi"], pic_contact: null },
  { id: 3, name: "DPUPR Cimahi", entity_type: "OPD", keywords: ["dpupr", "jalan rusak cimahi"], pic_contact: null },
  { id: 4, name: "DLHK Cimahi", entity_type: "OPD", keywords: ["dlhk", "sampah cimahi"], pic_contact: null },
  { id: 5, name: "Dishub Cimahi", entity_type: "OPD", keywords: ["dishub", "macet cimahi"], pic_contact: null },
];

export default function TargetEntitiesPage() {
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
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-smooth">
          <Plus className="w-4 h-4" /> Tambah Entity
        </button>
      </div>

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
            {mockEntities.map((e) => (
              <tr key={e.id} className="hover:bg-card-hover transition-smooth">
                <td className="px-4 py-3 font-medium text-foreground">{e.name}</td>
                <td className="px-4 py-3 text-muted">{e.entity_type}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {e.keywords.map((k) => (
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
    </div>
  );
}
