"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  AlertTriangle,
  Building2,
  Users,
  Shield,
  Menu as MenuIcon,
  ChevronLeft,
  Activity,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sentimen", href: "/dashboard/sentimen", icon: Activity },
  { name: "Feedback", href: "/dashboard/feedbacks", icon: MessageSquare },
  { name: "Pengaduan", href: "/dashboard/pengaduan", icon: AlertTriangle },
  { name: "Target Entity", href: "/dashboard/target-entities", icon: Building2 },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Roles", href: "/dashboard/roles", icon: Shield },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen flex flex-col border-r border-card-border bg-card/80 backdrop-blur-xl transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-card-border">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-foreground">
                  GOVMIND
                </span>
                <p className="text-[10px] text-muted leading-none">Sentimen Warga</p>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-accent/15 text-accent-light"
                    : "text-muted hover:text-foreground hover:bg-card-hover"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-[18px] h-[18px] flex-shrink-0",
                    isActive ? "text-accent-light" : ""
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 py-3 border-t border-card-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-xl text-sm text-muted hover:text-foreground hover:bg-card-hover transition-smooth"
          >
            {collapsed ? (
              <MenuIcon className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
