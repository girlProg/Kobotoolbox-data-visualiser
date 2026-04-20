"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { KoboAsset } from "@/lib/kobo/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Users, X } from "lucide-react";
import { useSidebar } from "./SidebarContext";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebar();
  const { data: assets, isLoading } = useSWR<KoboAsset[]>(
    "/api/kobo/assets",
    fetcher
  );

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          // Base
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-gray-50 border-r transition-transform duration-200",
          // Mobile: slide in/out
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible, relative positioning
          "md:relative md:translate-x-0 md:w-64 md:flex-shrink-0 md:min-h-screen"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            KoboToolbox
          </h2>
          {/* Close button — mobile only */}
          <button
            onClick={close}
            className="md:hidden p-1 rounded hover:bg-gray-200 text-muted-foreground"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link
            href="/dashboard"
            onClick={close}
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
              EMIS Officers
            </p>
            <Link
              href="/dashboard/officers"
              onClick={close}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/dashboard/officers"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-200 text-gray-700"
              )}
            >
              <Users size={14} className="flex-shrink-0" />
              Daily activity
            </Link>
          </div>

          <div className="pt-2">
            <p className="px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider pb-1">
              LGA Projects
            </p>

            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 mx-1 mb-1 rounded-md" />
              ))}

            {assets?.map((asset) => (
              <Link
                key={asset.uid}
                href={`/dashboard/projects/${asset.uid}`}
                onClick={close}
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

            {!isLoading && assets?.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground italic">
                No deployed projects found.
              </p>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
