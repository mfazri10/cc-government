import { cn } from "@/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "positive" | "negative" | "neutral" | "warning";
  size?: "sm" | "md";
}

const variants = {
  default: "bg-accent/15 text-accent-light",
  positive: "bg-positive-bg text-positive",
  negative: "bg-negative-bg text-negative",
  neutral: "bg-[rgba(100,116,139,0.12)] text-[#94a3b8]",
  warning: "bg-warning-bg text-warning",
};

export default function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}
