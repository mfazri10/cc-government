"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DaysFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDays = searchParams.get("days") || "30";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", e.target.value);
    router.push(`?${params.toString()}`);
  };

  return (
    <select
      value={currentDays}
      onChange={handleChange}
      className="px-3 py-2 rounded-xl bg-card border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 transition-smooth cursor-pointer"
    >
      <option value="7">7 Hari</option>
      <option value="30">30 Hari</option>
      <option value="90">90 Hari</option>
    </select>
  );
}
