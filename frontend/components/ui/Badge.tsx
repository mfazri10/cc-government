import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-card-border bg-card/60 text-foreground",
        positive:
          "border-positive/20 bg-positive/10 text-positive",
        negative:
          "border-negative/20 bg-negative/10 text-negative",
        warning:
          "border-warning/20 bg-warning/10 text-warning",
        info:
          "border-info/20 bg-info/10 text-info",
        neutral:
          "border-card-border bg-card-hover/50 text-muted",
        accent:
          "border-accent/20 bg-accent/10 text-accent-light",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
export default Badge
