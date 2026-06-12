"use client";

import { useI18n, Locale } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  const languages: { value: Locale; label: string; flag: string }[] = [
    { value: "id", label: "ID", flag: "🇮🇩" },
    { value: "en", label: "EN", flag: "🇬🇧" },
  ];

  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5">
      {languages.map((lang) => (
        <button
          key={lang.value}
          onClick={() => setLocale(lang.value)}
          className={`
            inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors
            ${
              locale === lang.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }
          `}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
}
