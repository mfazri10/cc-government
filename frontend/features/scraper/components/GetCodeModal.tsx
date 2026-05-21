"use client";

import { useState } from "react";
import { Code, Copy, Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface GetCodeModalProps {
  url: string;
  formats: string[];
  isOpen: boolean;
  onClose: () => void;
}

type Lang = "curl" | "python" | "javascript";

const LANGS: { id: Lang; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
];

function generateSnippet(lang: Lang, url: string, formats: string[]): string {
  const apiUrl = "http://localhost:8000/api/v1/scraper/scrape";
  const body = JSON.stringify({ url, formats }, null, 2);

  if (lang === "curl") {
    return `curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`;
  }

  if (lang === "python") {
    return `import requests

response = requests.post(
    "${apiUrl}",
    json=${body.replace(/"/g, '"')}
)

data = response.json()
print(f"Status: {data['status']}")
print(f"Markdown: {data.get('result_markdown', '')[:200]}...")`;
  }

  if (lang === "javascript") {
    return `const response = await fetch("${apiUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${body}),
});

const data = await response.json();
console.log("Status:", data.status);
console.log("Markdown:", data.result_markdown?.slice(0, 200));`;
  }

  return "";
}

export default function GetCodeModal({
  url,
  formats,
  isOpen,
  onClose,
}: GetCodeModalProps) {
  const [activeLang, setActiveLang] = useState<Lang>("curl");
  const [copied, setCopied] = useState(false);

  const snippet = generateSnippet(activeLang, url, formats);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-card-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <Code className="w-4 h-4 text-accent-light" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold">Get Code</DialogTitle>
              <DialogDescription className="text-[10px]">
                Snippet integrasi untuk API scraping
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Language Tabs */}
        <div className="flex border-b border-card-border">
          {LANGS.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setActiveLang(lang.id)}
              className={cn(
                "px-5 py-2.5 text-xs font-semibold transition-smooth border-b-2 cursor-pointer",
                activeLang === lang.id
                  ? "border-accent text-accent-light bg-accent/5"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Code Block */}
        <div className="relative p-4">
          <pre className="text-xs text-foreground/90 bg-card/60 border border-card-border rounded-xl p-4 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
            {snippet}
          </pre>

          {/* Copy Button */}
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="absolute top-6 right-6 gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-positive" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <p className="text-[10px] text-muted">
            Base URL: <code className="text-accent-light">http://localhost:8000</code> 
            {" · "}Target: <code className="text-foreground font-mono">{url || "..."}</code>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
