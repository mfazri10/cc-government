import { create } from "zustand"
import {
  performSearch,
  fetchScrapeJobs,
  fetchCrawlJobs,
  fetchScrapeStats,
  submitScrapeJob,
  submitCrawlJob,
} from "@/features/scraper/actions"
import type {
  ScrapeJobListItem,
  ScrapeStats,
  CrawlJob,
  SearchQueryResponse,
} from "@/types"

interface ScraperState {
  // Search
  searchQuery: string;
  searchSources: string[];
  searchResults: SearchQueryResponse | null;
  isSearchLoading: boolean;

  // Scrape Jobs
  scrapeJobs: ScrapeJobListItem[];
  scrapeJobsTotal: number;
  scrapeStats: ScrapeStats | null;
  isScrapeLoading: boolean;

  // Crawl Jobs
  crawlJobs: CrawlJob[];
  crawlJobsTotal: number;
  isCrawlLoading: boolean;

  // Setters & Actions
  setSearchQuery: (query: string) => void;
  setSearchSources: (sources: string[]) => void;
  clearSearchResults: () => void;
  executeSearch: (query: string, sources: string[], limit?: number) => Promise<void>;
  
  loadScrapeJobs: (page?: number, pageSize?: number) => Promise<void>;
  loadCrawlJobs: (page?: number, pageSize?: number) => Promise<void>;
  loadScrapeStats: () => Promise<void>;

  addScrapeJob: (url: string, formats: string[], jsonSchema?: Record<string, unknown>) => Promise<void>;
  addCrawlJob: (params: { url: string; maxDepth: number; limitPages: number; delaySeconds: number; pathFilter?: string }) => Promise<void>;
}

export const useScraperStore = create<ScraperState>((set, get) => ({
  searchQuery: "",
  searchSources: ["Web Search", "Berita Lokal"],
  searchResults: null,
  isSearchLoading: false,

  scrapeJobs: [],
  scrapeJobsTotal: 0,
  scrapeStats: null,
  isScrapeLoading: false,

  crawlJobs: [],
  crawlJobsTotal: 0,
  isCrawlLoading: false,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchSources: (searchSources) => set({ searchSources }),
  clearSearchResults: () => set({ searchResults: null }),

  executeSearch: async (query, sources, limit = 15) => {
    set({ isSearchLoading: true, searchQuery: query, searchSources: sources });
    try {
      const results = await performSearch(query, sources, limit);
      set({ searchResults: results, isSearchLoading: false });
    } catch (err) {
      set({ isSearchLoading: false });
      throw err;
    }
  },

  loadScrapeJobs: async (page = 1, pageSize = 20) => {
    set({ isScrapeLoading: true });
    try {
      const response = await fetchScrapeJobs(page, pageSize);
      set({
        scrapeJobs: response.data,
        scrapeJobsTotal: response.total,
        isScrapeLoading: false,
      });
    } catch (err) {
      set({ isScrapeLoading: false });
    }
  },

  loadCrawlJobs: async (page = 1, pageSize = 10) => {
    set({ isCrawlLoading: true });
    try {
      const response = await fetchCrawlJobs(page, pageSize);
      set({
        crawlJobs: response.data,
        crawlJobsTotal: response.total,
        isCrawlLoading: false,
      });
    } catch (err) {
      set({ isCrawlLoading: false });
    }
  },

  loadScrapeStats: async () => {
    try {
      const stats = await fetchScrapeStats();
      set({ scrapeStats: stats });
    } catch (err) {}
  },

  addScrapeJob: async (url, formats, jsonSchema) => {
    await submitScrapeJob({ url, formats, json_schema: jsonSchema });
    // Reload stats and jobs
    await get().loadScrapeJobs(1, 20);
    await get().loadScrapeStats();
  },

  addCrawlJob: async (params) => {
    await submitCrawlJob({
      url: params.url,
      max_depth: params.maxDepth,
      limit_pages: params.limitPages,
      delay_seconds: params.delaySeconds,
      path_filter: params.pathFilter,
    });
    // Reload crawl jobs
    await get().loadCrawlJobs(1, 10);
  },
}))
