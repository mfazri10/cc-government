"use client";

import { useEffect, useState } from "react";
import { Database, Play, Plus, RefreshCw, Loader2, AlertCircle, Trash2, Globe, Link2, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDataSourceStore } from "@/store/dataSourceStore";
import { fetchTargetEntities } from "@/features/target-entities/actions";
import { formatDateTime } from "@/utils/format";
import type { TargetEntity } from "@/types";
import { toast } from "react-hot-toast";

export default function SourcesPage() {
  const {
    sources,
    platforms,
    isLoading,
    isCreating,
    isDeleting,
    error,
    triggeringId,
    fetchSources,
    triggerScrape,
    loadPlatforms,
    addSource,
    removeSource,
  } = useDataSourceStore();

  // State target entities
  const [entities, setEntities] = useState<TargetEntity[]>([]);
  
  // State modal Tambah Source
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | "">("");
  const [selectedEntityId, setSelectedEntityId] = useState<number | "">("");

  // State modal Hapus Source
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingName, setDeletingName] = useState("");

  useEffect(() => {
    fetchSources();
    loadPlatforms();
    fetchTargetEntities()
      .then(setEntities)
      .catch((err) => console.error("Gagal memuat entitas target:", err));
  }, [fetchSources, loadPlatforms]);

  const handleOpenAddModal = () => {
    setNewSourceName("");
    setNewSourceUrl("");
    setSelectedPlatformId("");
    setSelectedEntityId("");
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) {
      toast.error("Nama sumber data harus diisi");
      return;
    }
    if (!newSourceUrl.trim()) {
      toast.error("URL target harus diisi");
      return;
    }
    if (!selectedPlatformId) {
      toast.error("Pilih platform terlebih dahulu");
      return;
    }
    if (!selectedEntityId) {
      toast.error("Pilih OPD/Target pemantauan");
      return;
    }

    const success = await addSource({
      name: newSourceName,
      url: newSourceUrl,
      source_id: Number(selectedPlatformId),
      target_entity_id: Number(selectedEntityId),
      status: "active",
    });

    if (success) {
      setIsAddOpen(false);
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    setDeletingId(id);
    setDeletingName(name);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingId === null) return;
    const success = await removeSource(deletingId, deletingName);
    if (success) {
      setIsDeleteOpen(false);
      setDeletingId(null);
      setDeletingName("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/20 border border-white/5">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Source & Ingestion Manager</h1>
            <p className="text-sm text-muted mt-1">Kelola sumber data dan jadwal otomatis scraping</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={fetchSources}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2 rounded-xl border border-card-border bg-card text-foreground cursor-pointer transition-all duration-200 hover:bg-card-hover"
          >
            <RefreshCw className={`w-4 h-4 text-muted ${isLoading ? "animate-spin" : ""}`} /> Sync
          </Button>
          <Button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl gradient-accent text-white hover:opacity-90 transition-smooth cursor-pointer border-transparent shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" /> Tambah Source
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card glass className="overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
            <p className="text-muted">Memuat data sumber...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-8 h-8 text-negative mb-4" />
            <p className="text-negative font-medium">{error}</p>
            <Button onClick={fetchSources} variant="link" className="mt-4 text-primary-500 text-sm hover:underline cursor-pointer">
              Coba Lagi
            </Button>
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Database className="w-8 h-8 text-muted mb-4 opacity-50" />
            <p className="text-muted font-medium">Belum ada sumber data yang dikonfigurasi.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Nama/URL</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terakhir Scrape</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s) => (
                <TableRow key={s.id} className="hover:bg-card-hover/40 transition-colors">
                  <TableCell className="font-semibold text-foreground/90">{s.source_name}</TableCell>
                  <TableCell>
                    <p className="text-foreground font-medium">{s.name}</p>
                    {s.url && s.url !== "#" && (
                      <a 
                        href={s.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-accent-light hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Link2 className="w-3 h-3" />
                        {s.url}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-muted font-medium">{s.target_entity_name}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "active" ? "positive" : "negative"} className="font-semibold">
                      {s.status === "active" ? "Aktif" : "Error"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground text-muted">
                    {s.last_scraped_at ? formatDateTime(s.last_scraped_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        onClick={() => triggerScrape(s.id, s.name)}
                        disabled={triggeringId === s.id}
                        variant="outline"
                        size="sm"
                        className="inline-flex items-center gap-1.5 bg-accent/10 border-transparent text-accent-light hover:bg-accent/20 cursor-pointer disabled:opacity-50 text-xs font-semibold"
                        title="Manual Trigger via Inngest"
                      >
                        {triggeringId === s.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" /> 
                        )}
                        Scrape Now
                      </Button>
                      <Button 
                        onClick={() => handleDeleteClick(s.id, s.name)}
                        disabled={isDeleting}
                        variant="outline"
                        size="sm"
                        className="inline-flex items-center gap-1.5 bg-negative-bg border-transparent text-negative hover:bg-negative/20 cursor-pointer text-xs font-semibold"
                        title="Hapus Sumber Data"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal dialog popup form tambah */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md w-full bg-card border border-card-border p-6 rounded-2xl glass-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Database className="w-5 h-5 text-primary" />
              Tambah Sumber Data Baru
            </DialogTitle>
            <DialogDescription className="text-sm text-muted">
              Hubungkan tautan eksternal baru untuk pelacakan sentimen warga secara berkala.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 my-2">
            <div>
              <label className="block text-xs font-bold uppercase text-muted mb-1">Nama Sumber Data</label>
              <Input
                type="text"
                placeholder="Contoh: Google Maps RSUD Cibabat"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                className="w-full bg-background/50 text-foreground border-card-border focus:ring-1 focus:ring-primary focus:border-primary"
                disabled={isCreating}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted mb-1">Tautan URL Scrape</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  type="url"
                  placeholder="https://example.com/reviews-page"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="w-full pl-9 bg-background/50 text-foreground border-card-border focus:ring-1 focus:ring-primary focus:border-primary"
                  disabled={isCreating}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-muted mb-1">Platform</label>
                <select
                  value={selectedPlatformId}
                  onChange={(e) => setSelectedPlatformId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-10 px-3 rounded-lg bg-background/50 border border-card-border text-foreground text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                  disabled={isCreating}
                  required
                >
                  <option value="" disabled className="bg-card">Pilih...</option>
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id} className="bg-card">
                      {p.name} ({p.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted mb-1">Target Entity / OPD</label>
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-10 px-3 rounded-lg bg-background/50 border border-card-border text-foreground text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                  disabled={isCreating}
                  required
                >
                  <option value="" disabled className="bg-card">Pilih...</option>
                  {entities.map((ent) => (
                    <option key={ent.id} value={ent.id} className="bg-card">
                      {ent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="pt-4 flex items-center justify-end gap-3 border-t border-card-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isCreating}
                className="bg-card border-card-border hover:bg-card-hover rounded-xl cursor-pointer font-semibold text-foreground text-xs h-10 px-4"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="gradient-accent text-white hover:opacity-90 rounded-xl cursor-pointer font-bold text-xs h-10 px-4 flex items-center gap-2 border-transparent"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Simpan & Daftarkan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal dialog popup konfirmasi hapus */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md w-full bg-card border border-card-border p-6 rounded-2xl glass-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Trash2 className="w-5 h-5 text-negative" />
              Hapus Sumber Data?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted">
              Apakah Anda yakin ingin menghapus sumber data <span className="font-bold text-foreground">"{deletingName}"</span>?
              Semua agenda sinkronisasi asinkron Inngest untuk sumber data ini akan dihentikan secara permanen.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex items-center justify-end gap-3 border-t border-card-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
              className="bg-card border-card-border hover:bg-card-hover rounded-xl cursor-pointer font-semibold text-foreground text-xs h-10 px-4"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-negative hover:bg-negative/80 text-white rounded-xl cursor-pointer font-bold text-xs h-10 px-4 flex items-center gap-2 border-transparent"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Hapus Permanen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
