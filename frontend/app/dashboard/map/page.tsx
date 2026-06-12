import { InteractiveMap } from "@/components/map/InteractiveMap";
import { fetchMapLocations } from "./actions";

export default async function MapPage() {
  let locations = [];

  try {
    const data = await fetchMapLocations();
    locations = data.locations || [];
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Peta Sentimen</h1>
          <p className="text-sm text-muted mt-1">
            Visualisasi lokasi OPD dan sentimen warga
          </p>
        </div>
        <div className="glass-card p-12 text-center">
          <p className="text-foreground font-medium">Gagal memuat data peta</p>
          <p className="text-sm text-muted mt-1">Pastikan backend API berjalan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Peta Sentimen</h1>
        <p className="text-sm text-muted mt-1">
          Visualisasi lokasi OPD dan sentimen warga
        </p>
      </div>

      <InteractiveMap locations={locations} />

      {/* Legend */}
      <div className="glass-card p-4">
        <h3 className="font-semibold mb-3">Keterangan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-positive" />
            <span className="text-sm">Positif - Sentimen baik dari warga</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-negative" />
            <span className="text-sm">Negatif - Perlu perhatian</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-warning" />
            <span className="text-sm">Netral - Tidak ada sentimen khusus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
