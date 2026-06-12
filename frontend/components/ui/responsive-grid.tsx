"use client";

import { ReactNode } from "react";

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  className = "",
}: ResponsiveGridProps) {
  const gridCols = [
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`grid ${gridCols} gap-${gap} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveCard({ children, className = "" }: ResponsiveCardProps) {
  return (
    <div
      className={`
        bg-card rounded-lg border shadow-sm
        p-4 md:p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface ResponsiveTableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export function ResponsiveTable({
  headers,
  children,
  className = "",
}: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {headers.map((header, i) => (
              <th
                key={i}
                className="text-left py-3 px-4 font-medium text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface MobileStackProps {
  children: ReactNode;
  className?: string;
}

export function MobileStack({ children, className = "" }: MobileStackProps) {
  return (
    <div className={`flex flex-col gap-4 md:hidden ${className}`}>
      {children}
    </div>
  );
}
