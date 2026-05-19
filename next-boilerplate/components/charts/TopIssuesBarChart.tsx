"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TopIssue } from "@/types";

interface TopIssuesBarChartProps {
  data: TopIssue[];
}

export default function TopIssuesBarChart({ data }: TopIssuesBarChartProps) {
  const COLORS = [
    "#f43f5e", "#fb7185", "#f97316", "#fbbf24", "#a78bfa",
    "#818cf8", "#6366f1", "#38bdf8", "#34d399", "#10b981",
  ];

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Top 10 Isu Terbanyak
      </h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="topic"
              width={120}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#e4e8f1",
              }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
