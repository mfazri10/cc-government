import { cn } from "@/utils/cn";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "positive" | "negative" | "warning";
}

const variantStyles = {
  default: {
    iconBg: "bg-accent/15",
    iconColor: "text-accent-light",
  },
  positive: {
    iconBg: "bg-positive-bg",
    iconColor: "text-positive",
  },
  negative: {
    iconBg: "bg-negative-bg",
    iconColor: "text-negative",
  },
  warning: {
    iconBg: "bg-warning-bg",
    iconColor: "text-warning",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="glass-card p-5 transition-smooth hover:border-accent/30 group">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted">{subtitle}</p>
          )}
          {trendValue && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up" && "text-positive",
                  trend === "down" && "text-negative",
                  trend === "neutral" && "text-muted"
                )}
              >
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "p-2.5 rounded-xl transition-smooth group-hover:scale-110",
            styles.iconBg
          )}
        >
          <Icon className={cn("w-5 h-5", styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
