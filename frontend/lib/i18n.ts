"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Locale = "id" | "en";

interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Locale, Translations> = {
  id: {
    common: {
      dashboard: "Dashboard",
      feedbacks: "Feedback",
      sentimen: "Sentimen",
      analytics: "Analitik",
      settings: "Pengaturan",
      users: "Pengguna",
      roles: "Peran",
      sources: "Sumber Data",
      scraper: "Scraper",
      crawler: "Crawler",
      search: "Cari",
      filter: "Filter",
      export: "Ekspor",
      download: "Unduh",
      upload: "Unggah",
      save: "Simpan",
      cancel: "Batal",
      delete: "Hapus",
      edit: "Edit",
      add: "Tambah",
      close: "Tutup",
      loading: "Memuat...",
      noData: "Tidak ada data",
      error: "Terjadi kesalahan",
      success: "Berhasil",
      confirm: "Konfirmasi",
      back: "Kembali",
      next: "Selanjutnya",
      previous: "Sebelumnya",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Ringkasan analisis sentimen warga",
      totalFeedbacks: "Total Feedback",
      positive: "Positif",
      negative: "Negatif",
      neutral: "Netral",
      needsAttention: "Butuh Perhatian",
      recentActivity: "Aktivitas Terbaru",
      sentimentTrend: "Tren Sentimen",
      topIssues: "Top Isu",
    },
    feedbacks: {
      title: "Daftar Feedback",
      subtitle: "Semua feedback dari warga",
      content: "Konten",
      author: "Penulis",
      source: "Sumber",
      sentiment: "Sentimen",
      date: "Tanggal",
      actions: "Aksi",
      searchPlaceholder: "Cari feedback...",
      filterBySentiment: "Filter berdasarkan sentimen",
      filterBySource: "Filter berdasarkan sumber",
      exportCSV: "Ekspor CSV",
      exportExcel: "Ekspor Excel",
    },
    settings: {
      title: "Pengaturan",
      subtitle: "Konfigurasi aplikasi",
      general: "Umum",
      alerts: "Alert",
      api: "API",
      language: "Bahasa",
      theme: "Tema",
    },
  },
  en: {
    common: {
      dashboard: "Dashboard",
      feedbacks: "Feedbacks",
      sentimen: "Sentiment",
      analytics: "Analytics",
      settings: "Settings",
      users: "Users",
      roles: "Roles",
      sources: "Data Sources",
      scraper: "Scraper",
      crawler: "Crawler",
      search: "Search",
      filter: "Filter",
      export: "Export",
      download: "Download",
      upload: "Upload",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      close: "Close",
      loading: "Loading...",
      noData: "No data",
      error: "An error occurred",
      success: "Success",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      previous: "Previous",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Citizen sentiment analysis summary",
      totalFeedbacks: "Total Feedbacks",
      positive: "Positive",
      negative: "Negative",
      neutral: "Neutral",
      needsAttention: "Needs Attention",
      recentActivity: "Recent Activity",
      sentimentTrend: "Sentiment Trend",
      topIssues: "Top Issues",
    },
    feedbacks: {
      title: "Feedback List",
      subtitle: "All citizen feedbacks",
      content: "Content",
      author: "Author",
      source: "Source",
      sentiment: "Sentiment",
      date: "Date",
      actions: "Actions",
      searchPlaceholder: "Search feedbacks...",
      filterBySentiment: "Filter by sentiment",
      filterBySource: "Filter by source",
      exportCSV: "Export CSV",
      exportExcel: "Export Excel",
    },
    settings: {
      title: "Settings",
      subtitle: "Application configuration",
      general: "General",
      alerts: "Alerts",
      api: "API",
      language: "Language",
      theme: "Theme",
    },
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((acc, part) => acc?.[part], obj) || path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale;
    if (saved && (saved === "id" || saved === "en")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
    document.documentElement.lang = newLocale;
  };

  const t = (key: string): string => {
    return getNestedValue(translations[locale], key);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export type { Locale };
