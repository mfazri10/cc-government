"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  Plus,
  RotateCw,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  Key,
  Globe,
  Settings,
  Clock,
  Play,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TargetEntity {
  id: number;
  name: string;
}

interface Monitor {
  id: string;
  platform: string;
  username: string;
  target_entity_id: number;
  target_entity_name?: string;
  is_active: boolean;
  scrape_interval_hours: number;
  max_posts_per_run: number;
  last_cursor: string | null;
  consecutive_failures: number;
  last_scraped_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Account {
  id: string;
  platform: string;
  username: string;
  status: string;
  proxy_url: string | null;
  last_used_at: string | null;
  updated_at: string;
}

interface Proxy {
  id: string;
  proxy_url: string;
  protocol: string;
  status: string;
  failure_count: number;
  last_checked_at: string | null;
  created_at: string;
}

interface ScrapeLog {
  id: string;
  social_monitor_id: string;
  social_account_id: string | null;
  proxy_id: string | null;
  status: string;
  items_scraped: number;
  duration_ms: number;
  retry_count: number;
  error_message: string | null;
  scraped_at: string;
  monitor_username?: string;
  monitor_platform?: string;
}

export default function SocialMonitorPage() {
  const [activeTab, setActiveTab] = useState<"monitors" | "accounts" | "proxies" | "logs">("monitors");
  
  // Data States
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [entities, setEntities] = useState<TargetEntity[]>([]);
  
  // Pagination & Filters
  const [logPage, setLogPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modals States
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);

  // Forms Input States
  const [monitorForm, setMonitorForm] = useState({
    platform: "instagram",
    username: "",
    target_entity_id: "",
    scrape_interval_hours: 24,
    max_posts_per_run: 10,
    is_active: true,
  });

  const [accountForm, setAccountForm] = useState({
    platform: "instagram",
    username: "",
    cookies: "",
    status: "VALID",
    proxy_url: "",
  });

  const [proxyForm, setProxyForm] = useState({
    proxy_url: "",
    protocol: "http",
    status: "ACTIVE",
  });

  // Alert/Toast State
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch functions
  const loadEntities = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/target-entities/`);
      if (res.ok) {
        const data = await res.json();
        setEntities(data);
      }
    } catch (e) {
      console.error("Failed to load target entities", e);
    }
  };

  const loadMonitors = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/social/monitors`);
      if (res.ok) {
        const data = await res.json();
        setMonitors(data);
      }
    } catch (e) {
      console.error(e);
      showToast("Gagal memuat target pemantauan.", "error");
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/social/accounts`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadProxies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/social/proxies`);
      if (res.ok) {
        const data = await res.json();
        setProxies(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadLogs = async (page = 1) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/social/logs?page=${page}&page_size=10`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
        setTotalLogs(data.total);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadEntities(), loadMonitors(), loadAccounts(), loadProxies(), loadLogs(logPage)]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs(logPage);
    }
  }, [logPage, activeTab]);

  // Monitor Handlers
  const handleSaveMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monitorForm.username || !monitorForm.target_entity_id) {
      showToast("Harap isi semua kolom wajib.", "error");
      return;
    }

    try {
      let res;
      if (editingMonitor) {
        // Update
        res = await fetch(`${API_BASE}/api/v1/social/monitors/${editingMonitor.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            is_active: monitorForm.is_active,
            scrape_interval_hours: Number(monitorForm.scrape_interval_hours),
            max_posts_per_run: Number(monitorForm.max_posts_per_run),
          }),
        });
      } else {
        // Create
        res = await fetch(`${API_BASE}/api/v1/social/monitors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: monitorForm.platform,
            username: monitorForm.username.trim(),
            target_entity_id: Number(monitorForm.target_entity_id),
            is_active: monitorForm.is_active,
            scrape_interval_hours: Number(monitorForm.scrape_interval_hours),
            max_posts_per_run: Number(monitorForm.max_posts_per_run),
          }),
        });
      }

      if (res.ok) {
        showToast(editingMonitor ? "Target pemantauan diperbarui." : "Target pemantauan ditambahkan.");
        setShowMonitorModal(false);
        setEditingMonitor(null);
        setMonitorForm({
          platform: "instagram",
          username: "",
          target_entity_id: "",
          scrape_interval_hours: 24,
          max_posts_per_run: 10,
          is_active: true,
        });
        loadMonitors();
      } else {
        const err = await res.json();
        showToast(err.message || "Gagal menyimpan data.", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem.", "error");
    }
  };

  const handleToggleActive = async (monitor: Monitor) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/social/monitors/${monitor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !monitor.is_active }),
      });
      if (res.ok) {
        showToast(monitor.is_active ? "Monitor dinonaktifkan." : "Monitor diaktifkan.");
        loadMonitors();
      }
    } catch (e) {
      showToast("Gagal mengubah status.", "error");
    }
  };

  const handleDeleteMonitor = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus target pemantauan ini?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/social/monitors/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Target pemantauan dihapus.");
        loadMonitors();
      }
    } catch (e) {
      showToast("Gagal menghapus monitor.", "error");
    }
  };

  const handleTriggerScrape = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/social/monitors/${id}/scrape`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        showToast(`Sinkronisasi selesai! Berhasil mengambil ${data.items_scraped} umpan balik baru.`);
        loadMonitors();
      } else {
        showToast(data.error_message || "Gagal sinkronisasi. Akun/proxy terblokir atau limit habis.", "error");
      }
    } catch (e) {
      showToast("Koneksi gagal saat sinkronisasi.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Account Handlers
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.username || (!editingAccount && !accountForm.cookies)) {
      showToast("Harap isi semua kolom wajib.", "error");
      return;
    }

    let parsedCookies = {};
    if (accountForm.cookies) {
      try {
        parsedCookies = JSON.parse(accountForm.cookies);
      } catch (err) {
        showToast("Kuki harus berupa JSON format valid.", "error");
        return;
      }
    }

    try {
      let res;
      if (editingAccount) {
        res = await fetch(`${API_BASE}/api/v1/social/accounts/${editingAccount.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: accountForm.status,
            proxy_url: accountForm.proxy_url ? accountForm.proxy_url.trim() : null,
            ...(accountForm.cookies ? { cookies: parsedCookies } : {}),
          }),
        });
      } else {
        res = await fetch(`${API_BASE}/api/v1/social/accounts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: accountForm.platform,
            username: accountForm.username.trim(),
            cookies: parsedCookies,
            status: accountForm.status,
            proxy_url: accountForm.proxy_url ? accountForm.proxy_url.trim() : null,
          }),
        });
      }

      if (res.ok) {
        showToast(editingAccount ? "Akun pengumpul diperbarui." : "Akun pengumpul ditambahkan.");
        setShowAccountModal(false);
        setEditingAccount(null);
        setAccountForm({
          platform: "instagram",
          username: "",
          cookies: "",
          status: "VALID",
          proxy_url: "",
        });
        loadAccounts();
      } else {
        const err = await res.json();
        showToast(err.message || "Gagal menyimpan akun.", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem.", "error");
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun pengumpul ini?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/social/accounts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Akun pengumpul dihapus.");
        loadAccounts();
      }
    } catch (e) {
      showToast("Gagal menghapus akun.", "error");
    }
  };

  // Proxy Handlers
  const handleSaveProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proxyForm.proxy_url) {
      showToast("Harap isi semua kolom wajib.", "error");
      return;
    }

    try {
      let res;
      if (editingProxy) {
        res = await fetch(`${API_BASE}/api/v1/social/proxies/${editingProxy.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: proxyForm.status }),
        });
      } else {
        res = await fetch(`${API_BASE}/api/v1/social/proxies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proxy_url: proxyForm.proxy_url.trim(),
            protocol: proxyForm.protocol,
            status: proxyForm.status,
          }),
        });
      }

      if (res.ok) {
        showToast(editingProxy ? "Proxy pool diperbarui." : "Proxy berhasil ditambahkan ke pool.");
        setShowProxyModal(false);
        setEditingProxy(null);
        setProxyForm({ proxy_url: "", protocol: "http", status: "ACTIVE" });
        loadProxies();
      } else {
        const err = await res.json();
        showToast(err.message || "Gagal menyimpan proxy.", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem.", "error");
    }
  };

  const handleDeleteProxy = async (id: string) => {
    if (!confirm("Hapus proxy ini dari pool rotator?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/social/proxies/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Proxy dihapus.");
        loadProxies();
      }
    } catch (e) {
      showToast("Gagal menghapus proxy.", "error");
    }
  };

  const getPlatformBadge = (platform: string) => {
    const plat = platform.toLowerCase();
    let classes = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    if (plat === "instagram") classes = "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200 dark:border-pink-900";
    if (plat === "tiktok") classes = "bg-black/90 text-white dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-700";
    if (plat === "facebook") classes = "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900";
    if (plat === "twitter" || plat === "x") classes = "bg-neutral-100 text-neutral-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-700";

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${classes}`}>
        {platform}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 animate-bounce ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center shadow-lg">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Media Sosial</h1>
            <p className="text-sm text-muted mt-0.5">
              Pemantauan warga digital melalui target username Instagram, TikTok, Facebook, & Twitter.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            className="flex items-center justify-center p-2.5 rounded-xl border border-card-border hover:bg-card-hover text-muted-foreground transition-smooth"
            title="Refresh Data"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          
          {activeTab === "monitors" && (
            <button
              onClick={() => {
                setEditingMonitor(null);
                setMonitorForm({
                  platform: "instagram",
                  username: "",
                  target_entity_id: entities[0]?.id ? String(entities[0].id) : "",
                  scrape_interval_hours: 24,
                  max_posts_per_run: 10,
                  is_active: true,
                });
                setShowMonitorModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white font-medium shadow-md transition-smooth hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Target</span>
            </button>
          )}

          {activeTab === "accounts" && (
            <button
              onClick={() => {
                setEditingAccount(null);
                setAccountForm({
                  platform: "instagram",
                  username: "",
                  cookies: "",
                  status: "VALID",
                  proxy_url: "",
                });
                setShowAccountModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white font-medium shadow-md transition-smooth hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Akun</span>
            </button>
          )}

          {activeTab === "proxies" && (
            <button
              onClick={() => {
                setEditingProxy(null);
                setProxyForm({ proxy_url: "", protocol: "http", status: "ACTIVE" });
                setShowProxyModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white font-medium shadow-md transition-smooth hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Proxy</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-card-border overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("monitors")}
          className={`px-5 py-3 font-semibold text-sm transition-smooth border-b-2 whitespace-nowrap ${
            activeTab === "monitors"
              ? "border-accent-light text-accent-light"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Target Pemantauan ({monitors.length})
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`px-5 py-3 font-semibold text-sm transition-smooth border-b-2 whitespace-nowrap ${
            activeTab === "accounts"
              ? "border-accent-light text-accent-light"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Kuki Akun Dummy ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab("proxies")}
          className={`px-5 py-3 font-semibold text-sm transition-smooth border-b-2 whitespace-nowrap ${
            activeTab === "proxies"
              ? "border-accent-light text-accent-light"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Rotasi Proxy Pool ({proxies.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-5 py-3 font-semibold text-sm transition-smooth border-b-2 whitespace-nowrap ${
            activeTab === "logs"
              ? "border-accent-light text-accent-light"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Log & Riwayat
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="glass-card p-16 text-center space-y-4">
          <RotateCw className="w-8 h-8 text-accent-light mx-auto animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Menghubungkan ke server dan mengambil data...</p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* Tab 1: Monitors */}
          {activeTab === "monitors" && (
            <div className="glass-card overflow-hidden">
              {monitors.length === 0 ? (
                <div className="p-16 text-center text-muted-foreground">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-40 text-accent-light" />
                  <p className="font-semibold text-foreground">Belum ada target pemantauan.</p>
                  <p className="text-sm mt-1">Daftarkan username OPD/Tokoh lokal untuk memulai penarikan feed.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-card-border bg-card-hover/50">
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target OPD</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frekuensi Sync</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sync Terakhir</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-5 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {monitors.map((m) => (
                        <tr key={m.id} className="hover:bg-card-hover/40 transition-smooth">
                          <td className="px-5 py-4 font-semibold text-foreground">
                            @{m.username}
                          </td>
                          <td className="px-5 py-4">
                            {getPlatformBadge(m.platform)}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {m.target_entity_name || `Entity ID: ${m.target_entity_id}`}
                          </td>
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              Tiap {m.scrape_interval_hours} jam
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-muted-foreground">
                            {m.last_scraped_at ? new Date(m.last_scraped_at).toLocaleString("id-ID") : "Belum pernah"}
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleToggleActive(m)}
                              className="focus:outline-none transition-smooth hover:scale-105 active:scale-95"
                            >
                              {m.is_active ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-900">
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-0.5 rounded-full text-xs font-semibold border border-rose-200 dark:border-rose-900">
                                  Nonaktif
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleTriggerScrape(m.id)}
                                disabled={actionLoading === m.id}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-smooth ${
                                  actionLoading === m.id
                                    ? "bg-slate-400 cursor-not-allowed"
                                    : "gradient-accent hover:shadow-md"
                                }`}
                              >
                                {actionLoading === m.id ? (
                                  <RotateCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                                <span>Sync</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMonitor(m);
                                  setMonitorForm({
                                    platform: m.platform,
                                    username: m.username,
                                    target_entity_id: String(m.target_entity_id),
                                    scrape_interval_hours: m.scrape_interval_hours,
                                    max_posts_per_run: m.max_posts_per_run,
                                    is_active: m.is_active,
                                  });
                                  setShowMonitorModal(true);
                                }}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-smooth"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMonitor(m.id)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-smooth"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Dummy Accounts */}
          {activeTab === "accounts" && (
            <div className="glass-card overflow-hidden">
              <div className="p-4 bg-amber-500/10 border-b border-card-border text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Seluruh kuki sesi yang Anda masukkan dienkripsi menggunakan algoritma AES-256 at-rest sebelum disimpan ke dalam database.</span>
              </div>
              {accounts.length === 0 ? (
                <div className="p-16 text-center text-muted-foreground">
                  <Key className="w-10 h-10 mx-auto mb-3 opacity-40 text-accent-light" />
                  <p className="font-semibold text-foreground">Belum ada akun pengumpul.</p>
                  <p className="text-sm mt-1">Daftarkan kuki sesi dari akun dummy agar scraper dapat menarik postingan privat/terkunci.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-card-border bg-card-hover/50">
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proxy Akun</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Penggunaan Terakhir</th>
                        <th className="px-5 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {accounts.map((a) => (
                        <tr key={a.id} className="hover:bg-card-hover/40 transition-smooth">
                          <td className="px-5 py-4 font-semibold text-foreground">
                            {a.username}
                          </td>
                          <td className="px-5 py-4">
                            {getPlatformBadge(a.platform)}
                          </td>
                          <td className="px-5 py-4 text-xs font-mono text-muted-foreground">
                            {a.proxy_url || "-"}
                          </td>
                          <td className="px-5 py-4">
                            {a.status === "VALID" ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-900">
                                Valid
                              </span>
                            ) : a.status === "EXPIRED" ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded-full text-xs font-semibold border border-amber-200 dark:border-amber-900">
                                Sesi Kedaluwarsa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-0.5 rounded-full text-xs font-semibold border border-rose-200 dark:border-rose-900">
                                Terblokir (Blocked)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs text-muted-foreground">
                            {a.last_used_at ? new Date(a.last_used_at).toLocaleString("id-ID") : "Belum digunakan"}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingAccount(a);
                                  setAccountForm({
                                    platform: a.platform,
                                    username: a.username,
                                    cookies: "", // Kosongkan demi keamanan, diisi jika ingin diganti
                                    status: a.status,
                                    proxy_url: a.proxy_url || "",
                                  });
                                  setShowAccountModal(true);
                                }}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-smooth"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(a.id)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-smooth"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Proxy Pool */}
          {activeTab === "proxies" && (
            <div className="glass-card overflow-hidden">
              {proxies.length === 0 ? (
                <div className="p-16 text-center text-muted-foreground">
                  <Globe className="w-10 h-10 mx-auto mb-3 opacity-40 text-accent-light" />
                  <p className="font-semibold text-foreground">Belum ada proxy terdaftar.</p>
                  <p className="text-sm mt-1">Daftarkan proxy residential/datacenter untuk mencegah IP-ban dari Instagram & TikTok.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-card-border bg-card-hover/50">
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proxy URL</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Protokol</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kegagalan</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terakhir Dicek</th>
                        <th className="px-5 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {proxies.map((p) => (
                        <tr key={p.id} className="hover:bg-card-hover/40 transition-smooth">
                          <td className="px-5 py-4 font-mono text-xs text-foreground">
                            {p.proxy_url}
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold text-muted-foreground uppercase">
                            {p.protocol}
                          </td>
                          <td className="px-5 py-4 text-xs font-medium text-foreground">
                            {p.failure_count} kali
                          </td>
                          <td className="px-5 py-4">
                            {p.status === "ACTIVE" ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-900">
                                Aktif
                              </span>
                            ) : p.status === "SLOW" ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded-full text-xs font-semibold border border-amber-200 dark:border-amber-900">
                                Lambat (Slow)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-0.5 rounded-full text-xs font-semibold border border-rose-200 dark:border-rose-900">
                                Blokir (Blocked)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs text-muted-foreground">
                            {p.last_checked_at ? new Date(p.last_checked_at).toLocaleString("id-ID") : "Belum dicek"}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingProxy(p);
                                  setProxyForm({
                                    proxy_url: p.proxy_url,
                                    protocol: p.protocol,
                                    status: p.status,
                                  });
                                  setShowProxyModal(true);
                                }}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-smooth"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProxy(p.id)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-smooth"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Logs */}
          {activeTab === "logs" && (
            <div className="glass-card overflow-hidden space-y-4">
              {logs.length === 0 ? (
                <div className="p-16 text-center text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-40 text-accent-light" />
                  <p className="font-semibold text-foreground">Belum ada riwayat aktivitas.</p>
                  <p className="text-sm mt-1">Aktivitas scraping otomatis atau manual akan tercatat di halaman ini.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-card-border bg-card-hover/50">
                          <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waktu Sync</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items Didapat</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Durasi</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Error Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border">
                        {logs.map((l) => (
                          <tr key={l.id} className="hover:bg-card-hover/40 transition-smooth">
                            <td className="px-5 py-4 text-xs font-medium text-foreground">
                              {new Date(l.scraped_at).toLocaleString("id-ID")}
                            </td>
                            <td className="px-5 py-4 font-semibold text-foreground">
                              @{l.monitor_username || "Unknown"}
                            </td>
                            <td className="px-5 py-4">
                              {getPlatformBadge(l.monitor_platform || "instagram")}
                            </td>
                            <td className="px-5 py-4">
                              {l.status === "SUCCESS" ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-900">
                                  Sukses
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-0.5 rounded-full text-xs font-semibold border border-rose-200 dark:border-rose-900">
                                  Gagal
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-xs font-bold text-foreground">
                              {l.items_scraped} item
                            </td>
                            <td className="px-5 py-4 text-xs text-muted-foreground font-mono">
                              {l.duration_ms} ms
                            </td>
                            <td className="px-5 py-4 text-xs text-rose-600 dark:text-rose-400 font-medium max-w-xs truncate" title={l.error_message || ""}>
                              {l.error_message || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="flex items-center justify-between p-4 border-t border-card-border">
                    <p className="text-xs text-muted-foreground">
                      Menampilkan 10 dari <span className="font-semibold">{totalLogs}</span> riwayat log
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLogPage(Math.max(1, logPage - 1))}
                        disabled={logPage === 1}
                        className="p-1.5 rounded-lg border border-card-border hover:bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed transition-smooth text-muted-foreground"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-semibold text-foreground px-2">Halaman {logPage}</span>
                      <button
                        onClick={() => setLogPage(logPage + 1)}
                        disabled={logPage * 10 >= totalLogs}
                        className="p-1.5 rounded-lg border border-card-border hover:bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed transition-smooth text-muted-foreground"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Target Monitor Modal */}
      {showMonitorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-card-border shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-card-border flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground">
                {editingMonitor ? "Edit Target Pemantauan" : "Tambah Target Pemantauan"}
              </h3>
              <button
                onClick={() => setShowMonitorModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMonitor} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Platform
                </label>
                <select
                  disabled={!!editingMonitor}
                  value={monitorForm.platform}
                  onChange={(e) => setMonitorForm({ ...monitorForm, platform: e.target.value })}
                  className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter / X</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Username Target <span className="text-rose-500">*</span>
                </label>
                <input
                  disabled={!!editingMonitor}
                  type="text"
                  required
                  placeholder="Contoh: disdukcapil.cimahi"
                  value={monitorForm.username}
                  onChange={(e) => setMonitorForm({ ...monitorForm, username: e.target.value })}
                  className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Target Entity (OPD / Instansi) <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!!editingMonitor}
                  required
                  value={monitorForm.target_entity_id}
                  onChange={(e) => setMonitorForm({ ...monitorForm, target_entity_id: e.target.value })}
                  className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                >
                  <option value="">-- Pilih OPD / Target --</option>
                  {entities.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Interval Sync (Jam)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={monitorForm.scrape_interval_hours}
                    onChange={(e) => setMonitorForm({ ...monitorForm, scrape_interval_hours: Number(e.target.value) })}
                    className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Max Post Per Run
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={monitorForm.max_posts_per_run}
                    onChange={(e) => setMonitorForm({ ...monitorForm, max_posts_per_run: Number(e.target.value) })}
                    className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={monitorForm.is_active}
                  onChange={(e) => setMonitorForm({ ...monitorForm, is_active: e.target.checked })}
                  className="rounded border-card-border text-accent-light focus:ring-accent-light w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-foreground select-none">
                  Aktifkan target monitor secara instan
                </label>
              </div>

              <div className="pt-4 border-t border-card-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMonitorModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-card-border hover:bg-card-hover text-muted-foreground transition-smooth"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl gradient-accent text-white shadow-md transition-smooth hover:scale-[1.02] active:scale-[0.98]"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Account Dummy Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-card-border shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-card-border flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground">
                {editingAccount ? "Edit Akun Pengumpul" : "Tambah Akun Pengumpul"}
              </h3>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAccount} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Platform
                  </label>
                  <select
                    disabled={!!editingAccount}
                    value={accountForm.platform}
                    onChange={(e) => setAccountForm({ ...accountForm, platform: e.target.value })}
                    className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter / X</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Username Akun Dummy <span className="text-rose-500">*</span>
                  </label>
                  <input
                    disabled={!!editingAccount}
                    type="text"
                    required
                    placeholder="Contoh: gov_bot_01"
                    value={accountForm.username}
                    onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                    className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Kuki Sesi (Cookies JSON) {!editingAccount && <span className="text-rose-500">*</span>}
                </label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  Format JSON Array kuki. Ekstrak kuki dari browser menggunakan ekstensi EditThisCookie atau sejenisnya.
                </p>
                <textarea
                  rows={4}
                  required={!editingAccount}
                  placeholder='Contoh: [{"name": "sessionid", "value": "xxxx", "domain": ".instagram.com"}]'
                  value={accountForm.cookies}
                  onChange={(e) => setAccountForm({ ...accountForm, cookies: e.target.value })}
                  className="w-full rounded-xl border border-card-border p-2.5 text-xs font-mono bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Proxy Spesifik Akun (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Format: http://username:password@host:port"
                  value={accountForm.proxy_url}
                  onChange={(e) => setAccountForm({ ...accountForm, proxy_url: e.target.value })}
                  className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                />
              </div>

              {editingAccount && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Status Akun
                  </label>
                  <select
                    value={accountForm.status}
                    onChange={(e) => setAccountForm({ ...accountForm, status: e.target.value })}
                    className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                  >
                    <option value="VALID">Valid</option>
                    <option value="EXPIRED">Sesi Kedaluwarsa</option>
                    <option value="BLOCKED">Terblokir</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-card-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-card-border hover:bg-card-hover text-muted-foreground transition-smooth"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl gradient-accent text-white shadow-md transition-smooth hover:scale-[1.02] active:scale-[0.98]"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Proxy Modal */}
      {showProxyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-card-border shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-card-border flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground">
                {editingProxy ? "Edit Proxy Pool" : "Tambah Proxy Baru"}
              </h3>
              <button
                onClick={() => setShowProxyModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProxy} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Proxy URL <span className="text-rose-500">*</span>
                </label>
                <input
                  disabled={!!editingProxy}
                  type="text"
                  required
                  placeholder="Format: http://username:password@host:port"
                  value={proxyForm.proxy_url}
                  onChange={(e) => setProxyForm({ ...proxyForm, proxy_url: e.target.value })}
                  className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Protokol
                </label>
                <select
                  disabled={!!editingProxy}
                  value={proxyForm.protocol}
                  onChange={(e) => setProxyForm({ ...proxyForm, protocol: e.target.value })}
                  className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                >
                  <option value="http">HTTP</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </div>

              {editingProxy && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Status Proxy
                  </label>
                  <select
                    value={proxyForm.status}
                    onChange={(e) => setProxyForm({ ...proxyForm, status: e.target.value })}
                    className="w-full rounded-xl border border-card-border p-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent-light"
                  >
                    <option value="ACTIVE">Aktif (Active)</option>
                    <option value="SLOW">Lambat (Slow)</option>
                    <option value="BLOCKED">Terblokir (Blocked)</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-card-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProxyModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-card-border hover:bg-card-hover text-muted-foreground transition-smooth"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl gradient-accent text-white shadow-md transition-smooth hover:scale-[1.02] active:scale-[0.98]"
                >
                  Simpan Proxy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
