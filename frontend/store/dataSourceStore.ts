import { create } from "zustand"
import { fetchDataSources, triggerManualScrape, createDataSource, deleteDataSource, fetchPlatforms } from "@/features/sources/actions"
import type { DataSource, SourcePlatform } from "@/types"
import { toast } from "react-hot-toast"

interface DataSourceState {
  sources: DataSource[];
  platforms: SourcePlatform[];
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  error: string | null;
  triggeringId: number | null;
  fetchSources: () => Promise<void>;
  triggerScrape: (id: number, name: string) => Promise<void>;
  loadPlatforms: () => Promise<void>;
  addSource: (data: { name: string; url: string; source_id: number; target_entity_id: number; status: string }) => Promise<boolean>;
  removeSource: (id: number, name: string) => Promise<boolean>;
}

export const useDataSourceStore = create<DataSourceState>((set, get) => ({
  sources: [],
  platforms: [],
  isLoading: false,
  isCreating: false,
  isDeleting: false,
  error: null,
  triggeringId: null,

  fetchSources: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchDataSources();
      set({ sources: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Gagal memuat sumber data", isLoading: false });
    }
  },

  triggerScrape: async (id: number, name: string) => {
    set({ triggeringId: id });
    try {
      const res = await triggerManualScrape(id);
      toast.success(res.message || `Scrape dipicu untuk ${name}`);
      // Reload sources to get updated status and timestamp
      await get().fetchSources();
    } catch (err: any) {
      toast.error(err.message || `Gagal memicu scrape untuk ${name}`);
    } finally {
      set({ triggeringId: null });
    }
  },

  loadPlatforms: async () => {
    try {
      const data = await fetchPlatforms();
      set({ platforms: data });
    } catch (err: any) {
      console.error("Gagal memuat platform:", err);
    }
  },

  addSource: async (data) => {
    set({ isCreating: true });
    try {
      await createDataSource(data);
      toast.success(`Berhasil menambahkan sumber data "${data.name}"`);
      await get().fetchSources();
      return true;
    } catch (err: any) {
      toast.error(err.message || `Gagal menambahkan sumber data "${data.name}"`);
      return false;
    } finally {
      set({ isCreating: false });
    }
  },

  removeSource: async (id, name) => {
    set({ isDeleting: true });
    try {
      await deleteDataSource(id);
      toast.success(`Berhasil menghapus sumber data "${name}"`);
      await get().fetchSources();
      return true;
    } catch (err: any) {
      toast.error(err.message || `Gagal menghapus sumber data "${name}"`);
      return false;
    } finally {
      set({ isDeleting: false });
    }
  },
}))
