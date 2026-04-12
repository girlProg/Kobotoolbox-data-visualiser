"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function Topbar({ title }: { title: string }) {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastRefreshed(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-white flex-shrink-0">
      <h1 className="font-semibold text-base">{title}</h1>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <RefreshCw size={12} />
        <span>
          Refreshes every 30s &mdash; last at{" "}
          {lastRefreshed.toLocaleTimeString()}
        </span>
      </div>
    </header>
  );
}
