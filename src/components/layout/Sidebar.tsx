"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { KoboAsset } from "@/lib/kobo/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function Sidebar() {
  const pathname = usePathname();
  const { data: assets, isLoading } = useSWR<KoboAsset[]>(
    "/api/kobo/assets",
    fetcher
  );

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-gray-50 min-h-screen flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          KoboToolbox
        </h2>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
            pathname === "/dashboard"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-gray-200 text-gray-700"
          )}
        >
          <LayoutDashboard size={16} />
          Overview
        </Link>

        <div className="pt-2">
          <p className="px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider pb-1">
            Projects
          </p>

          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 mx-1 mb-1 rounded-md" />
            ))}

          {assets?.map((asset) => (
            <Link
              key={asset.uid}
              href={`/dashboard/projects/${asset.uid}`}
              className={cn(
                "flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === `/dashboard/projects/${asset.uid}`
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-200 text-gray-700"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <FileText size={14} className="flex-shrink-0" />
                <span className="truncate" title={asset.name}>
                  {asset.name}
                </span>
              </span>
              <Badge variant="secondary" className="flex-shrink-0 text-xs">
                {asset.deployment__submission_count}
              </Badge>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
