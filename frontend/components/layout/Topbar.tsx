"use client";

import { Bell, Search, LogOut, User as UserIcon } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b border-card-border bg-card/60 backdrop-blur-xl">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Cari feedback, OPD, isu..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background/50 border border-card-border text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-smooth"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-card-hover transition-smooth">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-negative" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-card-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-tight">Super Admin</p>
            <p className="text-xs text-muted">super_admin</p>
          </div>
          <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-white" />
          </div>
          <button className="p-2 rounded-xl text-muted hover:text-negative hover:bg-negative-bg transition-smooth">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
