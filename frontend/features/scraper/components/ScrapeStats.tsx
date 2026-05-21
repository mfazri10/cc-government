"use client";

import { useEffect } from "react";
import {
  Globe,
  CheckCircle2,
  Clock,
  Database,
} from "lucide-react";
import { useScraperStore } from "@/store/scraperStore";
import { Card } from "@/components/ui/card";

interface StatCardData {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export default function ScrapeStatsBar() {
  const { scrapeStats: stats, loadScrapeStats } = useScraperStore();

  useEffect(() => {
    loadScrapeStats();
  }, []);

  if (!stats) return null;

  const cards: StatCardData[] = [
    {
      label: "Total Scrape",
      value: String(stats.total_jobs),
      icon: Globe,
      color: "text-accent-light",
      bgColor: "bg-accent/15",
    },
    {
      label: "Success Rate",
      value: `${stats.success_rate}%`,
      icon: CheckCircle2,
      color: "text-positive",
      bgColor: "bg-positive/15",
    },
    {
      label: "Avg. Time",
      value: stats.avg_time_seconds ? `${stats.avg_time_seconds}s` : "-",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/15",
    },
    {
      label: "Ingested",
      value: String(stats.total_ingested),
      icon: Database,
      color: "text-info",
      bgColor: "bg-info/15",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            glass
            className="p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-tight">
                {card.value}
              </p>
              <p className="text-[10px] text-muted uppercase tracking-wider font-medium">
                {card.label}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
