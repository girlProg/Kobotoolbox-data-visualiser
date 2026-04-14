"use client";

import { useState } from "react";
import { lgaProgressStats, StudentRecord } from "@/lib/kobo/agile";
import { KoboChoice } from "@/lib/kobo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";

type SortKey = "lga" | "done" | "total" | "left" | "pct";
type SortDir = "asc" | "desc";

function barColor(p: number) {
  if (p >= 100) return "bg-emerald-500";
  if (p >= 75)  return "bg-blue-500";
  if (p >= 40)  return "bg-amber-500";
  return "bg-rose-400";
}

function textColor(p: number) {
  if (p >= 100) return "text-emerald-600";
  if (p >= 75)  return "text-blue-600";
  if (p >= 40)  return "text-amber-600";
  return "text-rose-600";
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
        {active
          ? dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          : <ChevronDown className="h-3 w-3 opacity-20" />}
      </span>
    </th>
  );
}

interface Props {
  records: StudentRecord[];
  choices: KoboChoice[];
}

export function LgaProgressTable({ records, choices }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("done");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = lgaProgressStats(records, choices);
  const hasTotal = rows.some((r) => r.total > 0);
  const totalDone = rows.reduce((s, r) => s + r.done, 0);
  const totalAll  = rows.reduce((s, r) => s + r.total, 0);

  // Percentage function — uses target when available, share of total otherwise
  function rowPct(done: number, total: number): number {
    if (hasTotal) return total > 0 ? Math.round((done / total) * 100) : 0;
    return totalDone > 0 ? Math.round((done / totalDone) * 100) : 0;
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...rows].sort((a, b) => {
    const aLeft = a.total > 0 ? a.total - a.done : Infinity;
    const bLeft = b.total > 0 ? b.total - b.done : Infinity;
    let cmp = 0;
    switch (sortKey) {
      case "lga":   cmp = a.lga.localeCompare(b.lga); break;
      case "done":  cmp = a.done - b.done; break;
      case "total": cmp = a.total - b.total; break;
      case "left":  cmp = aLeft - bLeft; break;
      case "pct":   cmp = rowPct(a.done, a.total) - rowPct(b.done, b.total); break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const overallPct = hasTotal && totalAll > 0
    ? Math.round((totalDone / totalAll) * 100)
    : null;

  const pctLabel = hasTotal ? "% done" : "% share";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between flex-wrap gap-2">
          <span>Progress by LGA</span>
          <span className="text-xs font-normal text-muted-foreground">
            {totalDone.toLocaleString()} submissions
            {hasTotal && overallPct !== null && (
              <> · {totalAll.toLocaleString()} students · {overallPct}% done</>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <SortHeader label="LGA"    sortKey="lga"   current={sortKey} dir={sortDir} onSort={handleSort} className="text-left pl-4" />
                <SortHeader label="Done"   sortKey="done"  current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                {hasTotal && (
                  <>
                    <SortHeader label="Total" sortKey="total" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                    <SortHeader label="Left"  sortKey="left"  current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                  </>
                )}
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Progress
                </th>
                <SortHeader label={pctLabel} sortKey="pct" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((row) => {
                const left = row.total > 0 ? row.total - row.done : null;
                const p    = rowPct(row.done, row.total);

                return (
                  <tr key={row.lga} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 pl-4 font-medium">{row.lga}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.done.toLocaleString()}</td>

                    {hasTotal && (
                      <>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {row.total > 0 ? row.total.toLocaleString() : "—"}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums font-medium ${
                          left === null ? "text-muted-foreground"
                          : left > 0    ? "text-rose-600"
                          : "text-emerald-600"
                        }`}>
                          {left === null ? "—" : left > 0 ? left.toLocaleString() : "✓"}
                        </td>
                      </>
                    )}

                    <td className="px-3 py-2 hidden sm:table-cell w-32">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(p)}`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-3 py-2 pr-4 text-right tabular-nums font-semibold">
                      <span className={textColor(p)}>{p}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="border-t bg-muted/40">
              <tr>
                <td className="px-3 py-2 pl-4 text-xs font-semibold text-muted-foreground">Total</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-xs">
                  {totalDone.toLocaleString()}
                </td>
                {hasTotal && (
                  <>
                    <td className="px-3 py-2 text-right tabular-nums text-xs text-muted-foreground">
                      {totalAll.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs text-rose-600 font-medium">
                      {(totalAll - totalDone).toLocaleString()}
                    </td>
                  </>
                )}
                <td className="hidden sm:table-cell" />
                <td className="px-3 py-2 pr-4 text-right tabular-nums font-bold text-xs">
                  {overallPct !== null ? `${overallPct}%` : "100%"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!hasTotal && (
          <p className="px-4 py-2 text-xs text-muted-foreground border-t">
            No student targets in form metadata — % shows each LGA&apos;s share of total submissions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
