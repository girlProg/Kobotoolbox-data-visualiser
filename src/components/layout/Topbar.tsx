"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Menu } from "lucide-react";
import { useSidebar } from "./SidebarContext";

export function Topbar({ title }: { title: string }) {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { toggle } = useSidebar();

  useEffect(() => {
    const interval = setInterval(() => setLastRefreshed(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 md:px-6 bg-white flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="md:hidden p-1.5 rounded hover:bg-gray-100 text-muted-foreground"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-semibold text-sm md:text-base truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
        <RefreshCw size={12} />
        <span className="hidden sm:inline">
          Refreshes every 30s &mdash; last at {lastRefreshed.toLocaleTimeString()}
        </span>
        <span className="sm:hidden">{lastRefreshed.toLocaleTimeString()}</span>
      </div>
    </header>
  );
}
