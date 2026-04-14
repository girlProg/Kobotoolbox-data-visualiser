"use client";

import { useState } from "react";
import { LgaProgress } from "@/app/api/kobo/assets/progress/route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";

type SortKey = "name" | "done" | "total" | "left" | "pct";
type SortDir = "asc" | "desc";

function pct(done: number, total: number) {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

function lganame(name: string) {
  // Strip common prefixes like "Niger Agile " or "Niger AGILE " from display
  return name.replace(/^niger\s+agile\s*/i, "").trim() || name;
}

interface SortHeaderProps {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}

function SortHeader({ label, sortKey, current, dir, onSort, className = "" }: SortHeaderProps) {
  const active = current === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`cursor-pointer select-none px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap ${className}`}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {active ? (
          dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-20" />
        )}
      </span>
    </th>
  );
}

interface Props {
  data: LgaProgress[];
}

export function LgaProgressTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("pct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...data].sort((a, b) => {
    const aLeft = (a.total || 0) - a.done;
    const bLeft = (b.total || 0) - b.done;
    let cmp = 0;
    switch (sortKey) {
      case "name": cmp = lganame(a.name).localeCompare(lganame(b.name)); break;
      case "done": cmp = a.done - b.done; break;
      case "total": cmp = (a.total || 0) - (b.total || 0); break;
      case "left": cmp = aLeft - bLeft; break;
      case "pct": cmp = pct(a.done, a.total) - pct(b.done, b.total); break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const overallDone = data.reduce((s, r) => s + r.done, 0);
  const overallTotal = data.reduce((s, r) => s + (r.total || 0), 0);
  const overallPct = pct(overallDone, overallTotal);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between flex-wrap gap-2">
          <span>LGA progress</span>
          {overallTotal > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              Overall: {overallDone.toLocaleString()} / {overallTotal.toLocaleString()} students ({overallPct}%)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <SortHeader label="LGA" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} className="text-left pl-4" />
                <SortHeader label="Done" sortKey="done" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                <SortHeader label="Total" sortKey="total" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                <SortHeader label="Left" sortKey="left" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left hidden sm:table-cell">
                  Progress
                </th>
                <SortHeader label="%" sortKey="pct" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((row) => {
                const left = (row.total || 0) - row.done;
                const p = pct(row.done, row.total);
                const hasTotal = row.total > 0;
                return (
                  <tr key={row.uid} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 pl-4 font-medium">{lganame(row.name)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.done.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {hasTotal ? row.total.toLocaleString() : "—"}
                    </td>
                    <td className={`px-3 py-2 text-right tabular-nums ${left > 0 ? "text-rose-600 font-medium" : "text-emerald-600"}`}>
                      {hasTotal ? (left > 0 ? left.toLocaleString() : "✓") : "—"}
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell w-36">
                      {hasTotal ? (
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${p === 100 ? "bg-emerald-500" : p >= 75 ? "bg-blue-500" : p >= 40 ? "bg-amber-500" : "bg-rose-400"}`}
                            style={{ width: `${p}%` }}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">no target</span>
                      )}
                    </td>
                    <td className="px-3 py-2 pr-4 text-right tabular-nums font-semibold">
                      {hasTotal ? (
                        <span className={p === 100 ? "text-emerald-600" : p >= 75 ? "text-blue-600" : p >= 40 ? "text-amber-600" : "text-rose-600"}>
                          {p}%
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
