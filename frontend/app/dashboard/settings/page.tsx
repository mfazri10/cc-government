"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Cpu,
  ShieldCheck,
  Database,
  RefreshCcw,
} from "lucide-react";
import { fetchSetting, updateSetting, SystemSetting } from "@/features/settings/actions";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [originalKey, setOriginalKey] = useState("");
  const [description, setDescription] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });
  const [isDbSetting, setIsDbSetting] = useState(false);

  // Load API Key on mount
  const loadSetting = async () => {
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const data = await fetchSetting("GEMINI_API_KEY");
      setApiKey(data.value);
      setOriginalKey(data.value);
      setDescription(data.description || "Google Gemini API Key untuk analisis sentimen & masukan warga.");
      // Check if it's set in DB or is using the fallback default placeholder
      if (data.value && data.value !== "your-gemini-api-key-here") {
        setIsDbSetting(true);
      } else {
        setIsDbSetting(false);
      }
    } catch (error: any) {
      console.error("Gagal memuat setting:", error);
      // Fallback empty
      setApiKey("");
      setOriginalKey("");
      setIsDbSetting(false);
      setStatus({
        type: "error",
        message: "Gagal menghubungkan ke backend untuk mengambil data konfigurasi.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetting();
  }, []);

  // Handle Save Setting
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: null, message: "" });

    try {
      await updateSetting("GEMINI_API_KEY", apiKey);
      setOriginalKey(apiKey);
      setIsDbSetting(apiKey.trim().length > 0 && apiKey !== "your-gemini-api-key-here");
      setStatus({
        type: "success",
        message: "Konfigurasi GEMINI_API_KEY berhasil disimpan dan langsung aktif di worker!",
      });
    } catch (error: any) {
      console.error("Gagal menyimpan setting:", error);
      setStatus({
        type: "error",
        message: error.message || "Gagal menyimpan konfigurasi ke database.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">System Settings</h1>
            <p className="text-sm text-muted mt-0.5">
              Konfigurasi modul tata kelola kota & parameter AI secara dinamis
            </p>
          </div>
        </div>

        <button
          onClick={loadSetting}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-card-border bg-card text-foreground text-sm font-medium hover:bg-card-hover disabled:opacity-50 transition-smooth cursor-pointer"
        >
          <RefreshCcw className={`w-4 h-4 text-muted ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        // Loading Skeleton
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 glass-card p-6 space-y-6">
            <div className="h-6 bg-card-border rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-card-border rounded w-1/4"></div>
              <div className="h-10 bg-card-border rounded w-full"></div>
            </div>
            <div className="h-10 bg-card-border rounded w-1/4"></div>
          </div>
          <div className="glass-card p-6 space-y-4">
            <div className="h-6 bg-card-border rounded w-1/2"></div>
            <div className="h-20 bg-card-border rounded w-full"></div>
          </div>
        </div>
      ) : (
        // Settings Content
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Card (Gemini Config) */}
          <div className="lg:col-span-2 glass-card overflow-hidden">
            <div className="p-6 border-b border-card-border bg-card-hover/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent-light">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-foreground">Google Gemini Integration</h2>
                  <p className="text-xs text-muted">Ubah Google Gemini API Key yang digunakan untuk model analisis</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Alert Status Banners */}
              {status.type && (
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
                    status.type === "success"
                      ? "bg-positive/10 border border-positive/20 text-positive"
                      : "bg-negative/10 border border-negative/20 text-negative"
                  }`}
                >
                  {status.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="font-medium">{status.message}</span>
                </div>
              )}

              {/* API Key Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="gemini-key" className="text-sm font-semibold text-foreground">
                    Gemini API Key (GEMINI_API_KEY)
                  </label>
                  {isDbSetting ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-positive-bg text-positive border border-positive/10">
                      <Database className="w-2.5 h-2.5" /> Database Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-warning-bg text-warning border border-warning/10">
                      <Cpu className="w-2.5 h-2.5" /> Env Fallback Active
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    id="gemini-key"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Masukan Google Gemini API Key Anda..."
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-card/60 border border-card-border text-foreground placeholder-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-smooth"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-smooth cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {description} Jika dikosongkan atau menggunakan placeholder bawaan, sistem akan otomatis menggunakan
                  nilai fallback yang didapat dari file <code className="text-accent-light bg-card px-1.5 py-0.5 rounded">.env</code>.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-card-border flex justify-end">
                <button
                  type="submit"
                  disabled={saving || apiKey === originalKey}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 transition-smooth shadow-lg shadow-accent/15 disabled:shadow-none cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar Status Info Card */}
          <div className="space-y-6">
            {/* System Status Card */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">Integration Status</h3>
              
              <div className="space-y-3">
                {/* Database Connectivity */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-card/40 border border-card-border text-sm">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-accent-light" />
                    <span className="text-foreground font-medium">Database Config</span>
                  </div>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-positive"></span>
                  </span>
                </div>

                {/* EWS Alerts Status */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-card/40 border border-card-border text-sm">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-accent-light" />
                    <span className="text-foreground font-medium">Sentiment Analysis Engine</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-positive-badge">
                    Active
                  </span>
                </div>

                {/* Env Fallback status */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-card/40 border border-card-border text-sm">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-accent-light" />
                    <span className="text-foreground font-medium">Security & Decryption</span>
                  </div>
                  <span className="text-xs font-bold text-accent-light">Enabled</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-muted border-t border-card-border leading-relaxed">
                Perubahan pada halaman ini disimpan langsung pada tabel <code className="text-accent-light bg-card px-1 py-0.5 rounded">system_settings</code>. Nilai API Key dienkripsi dan dijamin keamanannya dalam server lokal GOVMIND.
              </div>
            </div>

            {/* Instruction Box */}
            <div className="glass-card p-6 bg-gradient-to-br from-accent/5 to-transparent border border-accent/15">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-light" />
                Cara Mendapatkan API Key
              </h4>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Google Gemini API Key gratis dapat dibuat melalui platform <strong>Google AI Studio</strong>.
              </p>
              <ol className="list-decimal list-inside text-[11px] text-muted space-y-1.5 mt-3">
                <li>Buka <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-accent-light hover:underline font-semibold">Google AI Studio</a></li>
                <li>Pilih menu <strong>Get API Key</strong></li>
                <li>Pilih <strong>Create API Key</strong></li>
                <li>Salin kuncinya dan tempelkan pada kolom di sebelah kiri</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
