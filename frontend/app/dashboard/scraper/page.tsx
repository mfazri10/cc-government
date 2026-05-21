"use client";

import { useState } from "react";
import {
  Globe,
  Search,
  FileText,
  Map,
  Lock,
} from "lucide-react";
import ScrapeForm from "@/features/scraper/components/ScrapeForm";
import ScrapeJobsList from "@/features/scraper/components/ScrapeJobsList";
import ScrapeStatsBar from "@/features/scraper/components/ScrapeStats";
import CrawlForm from "@/features/scraper/components/CrawlForm";
import CrawlJobsList from "@/features/scraper/components/CrawlJobsList";
import SearchForm from "@/features/scraper/components/SearchForm";
import SearchResultsList from "@/features/scraper/components/SearchResultsList";
import { cn } from "@/utils/cn";
import type { SearchQueryResponse } from "@/types";

const TABS = [
  { id: "search", label: "Discover", icon: Search, locked: false, phase: "" },
  { id: "scrape", label: "Scrape URL", icon: FileText, locked: false, phase: "" },
  { id: "crawl", label: "Crawl Site", icon: Map, locked: false, phase: "" },
];

export default function ScraperPage() {
  const [activeTab, setActiveTab] = useState<"search" | "scrape" | "crawl">("search");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Search state
  const [searchResults, setSearchResults] = useState<SearchQueryResponse | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const handleCrawlJobCreated = () => {
    // Pemicu untuk memuat ulang daftar pekerjaan
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/20">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Scraping, Crawling & Discover Engine
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Eksplorasi isu publik global, ekstrak halaman spesifik, atau rayap situs web penuh
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <ScrapeStatsBar />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-card-border w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isTabActive = activeTab === tab.id;

          if (tab.locked) {
            return (
              <div
                key={tab.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted text-sm font-medium cursor-not-allowed opacity-50 select-none"
                title={`Fitur ${tab.label} akan dirilis pada ${tab.phase}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <Lock className="w-3 h-3 text-muted" />
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "search" | "scrape" | "crawl")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-smooth cursor-pointer",
                isTabActive
                  ? "gradient-accent text-white shadow-lg shadow-accent/20"
                  : "text-muted hover:text-foreground hover:bg-card-hover"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "search" ? (
          <>
            <SearchForm onResults={setSearchResults} onLoadingChange={setIsSearchLoading} />
            <SearchResultsList data={searchResults} isLoading={isSearchLoading} />
          </>
        ) : activeTab === "scrape" ? (
          <>
            <ScrapeForm />
            <ScrapeJobsList />
          </>
        ) : (
          <>
            <CrawlForm onJobCreated={handleCrawlJobCreated} />
            <CrawlJobsList key={refreshTrigger} />
          </>
        )}
      </div>
    </div>
  );
}
