"use client";

import { useState } from "react";
import {
  FileText,
  Link2,
  Braces,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Clock,
  Sparkles,
  Code,
  Image,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import Badge from "@/components/ui/Badge";
import type { ScrapeJob } from "@/types";

type TabId = "markdown" | "links" | "json" | "summary" | "html" | "images" | "metadata";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  available: boolean;
}

interface ScrapeResultViewerProps {
  job: ScrapeJob;
}

export default function ScrapeResultViewer({ job }: ScrapeResultViewerProps) {
  const tabs: Tab[] = [
    {
      id: "markdown",
      label: "Markdown",
      icon: FileText,
      available: !!job.result_markdown,
    },
    {
      id: "summary",
      label: "Summary",
      icon: Sparkles,
      available: !!job.result_summary,
    },
    {
      id: "links",
      label: `Links (${job.result_links?.length || 0})`,
      icon: Link2,
      available: !!job.result_links && job.result_links.length > 0,
    },
    {
      id: "json",
      label: "JSON",
      icon: Braces,
      available: !!job.result_json,
    },
    {
      id: "images",
      label: `Images (${job.result_images?.length || 0})`,
      icon: Image,
      available: !!job.result_images && job.result_images.length > 0,
    },
    {
      id: "html",
      label: "HTML",
      icon: Code,
      available: !!job.result_html,
    },
    {
      id: "metadata",
      label: "Metadata",
      icon: Globe,
      available: !!job.result_metadata,
    },
  ];

  const firstAvailable = tabs.find((t) => t.available)?.id || "markdown";
  const [activeTab, setActiveTab] = useState<TabId>(firstAvailable);
  const [copied, setCopied] = useState(false);
  const [expandedMarkdown, setExpandedMarkdown] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCopyContent = (): string => {
    if (activeTab === "markdown") return job.result_markdown || "";
    if (activeTab === "summary") return job.result_summary || "";
    if (activeTab === "html") return job.result_html || "";
    if (activeTab === "json") return JSON.stringify(job.result_json, null, 2);
    if (activeTab === "links") return JSON.stringify(job.result_links, null, 2);
    if (activeTab === "images") return JSON.stringify(job.result_images, null, 2);
    if (activeTab === "metadata") return JSON.stringify(job.result_metadata, null, 2);
    return "";
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-card-border bg-card-hover/20">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Badge variant="positive">
              <Check className="w-3 h-3 mr-1" />
              Completed
            </Badge>
            <span className="text-xs text-muted font-mono truncate max-w-md">
              {job.url}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {job.result_metadata?.title && (
              <span className="text-xs text-muted hidden sm:inline">
                {job.result_metadata.title.slice(0, 40)}
                {job.result_metadata.title.length > 40 ? "..." : ""}
              </span>
            )}
            <button
              onClick={() => handleCopy(getCopyContent())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-card-border text-muted hover:text-foreground hover:bg-card-hover transition-smooth cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-positive" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-card-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => tab.available && setActiveTab(tab.id)}
              disabled={!tab.available}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-smooth border-b-2 cursor-pointer whitespace-nowrap",
                activeTab === tab.id
                  ? "border-accent text-accent-light bg-accent/5"
                  : tab.available
                    ? "border-transparent text-muted hover:text-foreground hover:bg-card-hover"
                    : "border-transparent text-muted/30 cursor-not-allowed"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Markdown Tab */}
        {activeTab === "markdown" && job.result_markdown && (
          <div className="space-y-3">
            <pre
              className={cn(
                "text-sm text-foreground/90 whitespace-pre-wrap font-sans leading-relaxed overflow-hidden transition-all",
                expandedMarkdown ? "max-h-none" : "max-h-80"
              )}
            >
              {job.result_markdown}
            </pre>
            {job.result_markdown.length > 1000 && (
              <button
                onClick={() => setExpandedMarkdown(!expandedMarkdown)}
                className="flex items-center gap-1 text-xs text-accent-light hover:underline cursor-pointer"
              >
                {expandedMarkdown ? (
                  <>
                    <ChevronUp className="w-3 h-3" /> Tampilkan lebih sedikit
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" /> Tampilkan selengkapnya
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === "summary" && job.result_summary && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent-light" />
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                AI Summary
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {job.result_summary}
            </p>
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && job.result_links && (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {job.result_links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-card-hover transition-smooth group"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted flex-shrink-0 group-hover:text-accent-light" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {link.text || link.url}
                  </p>
                  <p className="text-[10px] text-muted truncate font-mono">
                    {link.url}
                  </p>
                </div>
                {link.is_external && (
                  <Badge variant="neutral" size="sm">
                    external
                  </Badge>
                )}
              </a>
            ))}
          </div>
        )}

        {/* JSON Tab */}
        {activeTab === "json" && job.result_json && (
          <pre className="text-sm text-accent-light bg-card/60 rounded-xl p-4 overflow-x-auto max-h-96 font-mono">
            {JSON.stringify(job.result_json, null, 2)}
          </pre>
        )}

        {/* Images Tab */}
        {activeTab === "images" && job.result_images && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {job.result_images.map((img, idx) => (
                <a
                  key={idx}
                  href={img.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-xl border border-card-border overflow-hidden hover:border-accent/50 transition-smooth"
                >
                  <div className="aspect-video bg-card-hover flex items-center justify-center overflow-hidden">
                    <img
                      src={img.src}
                      alt={img.alt || `Image ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  {img.alt && (
                    <p className="p-2 text-[10px] text-muted truncate">
                      {img.alt}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* HTML Tab */}
        {activeTab === "html" && job.result_html && (
          <pre className="text-xs text-foreground/80 bg-card/60 rounded-xl p-4 overflow-x-auto max-h-96 font-mono whitespace-pre-wrap">
            {job.result_html.slice(0, 5000)}
            {job.result_html.length > 5000 && "\n\n... (truncated)"}
          </pre>
        )}

        {/* Metadata Tab */}
        {activeTab === "metadata" && job.result_metadata && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(job.result_metadata).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-sm text-foreground break-all">
                  {String(value) || "-"}
                </p>
              </div>
            ))}
            {job.completed_at && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Completed At
                </p>
                <p className="text-sm text-foreground">
                  {formatDateTime(job.completed_at)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
