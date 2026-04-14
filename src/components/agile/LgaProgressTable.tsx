"use client";

import { useState } from "react";
import { lgaProgressStats, StudentRecord } from "@/lib/kobo/agile";
import { KoboChoice } from "@/lib/kobo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";

type SortKey = "lga" | "done" | "total" | "left" | "pct";
type SortDir = "asc" | "desc";

function pct(done: number, total: number) {
  if (total === 0) return null;
  return Math.round((done / total) * 100);
}

function barColor(p: number) {
  if (p >= 100) return "bg-emerald-500";
  if (p >= 75) return "bg-blue-500";
  if (p >= 40) return "bg-amber-500";
  return "bg-rose-400";
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

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...rows].sort((a, b) => {
    const aLeft = a.total > 0 ? a.total - a.done : Infinity;
    const bLeft = b.total > 0 ? b.total - b.done : Infinity;
    const aP = pct(a.done, a.total) ?? -1;
    const bP = pct(b.done, b.total) ?? -1;
    let cmp = 0;
    switch (sortKey) {
      case "lga":   cmp = a.lga.localeCompare(b.lga); break;
      case "done":  cmp = a.done - b.done; break;
      case "total": cmp = a.total - b.total; break;
      case "left":  cmp = aLeft - bLeft; break;
      case "pct":   cmp = aP - bP; break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalDone  = rows.reduce((s, r) => s + r.done, 0);
  const totalAll   = rows.reduce((s, r) => s + r.total, 0);
  const overallPct = pct(totalDone, totalAll);

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
                <SortHeader label="LGA"   sortKey="lga"   current={sortKey} dir={sortDir} onSort={handleSort} className="text-left pl-4" />
                <SortHeader label="Done"  sortKey="done"  current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                {hasTotal && (
                  <>
                    <SortHeader label="Total" sortKey="total" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                    <SortHeader label="Left"  sortKey="left"  current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                  </>
                )}
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Progress
                </th>
                {hasTotal && (
                  <SortHeader label="%" sortKey="pct" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right pr-4" />
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((row) => {
                const left = row.total > 0 ? row.total - row.done : null;
                const p    = pct(row.done, row.total);
                // Relative bar width when no totals available (% of max done)
                const maxDone = Math.max(...rows.map((r) => r.done), 1);
                const relWidth = Math.round((row.done / maxDone) * 100);

                return (
                  <tr key={row.lga} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 pl-4 font-medium">{row.lga}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.done.toLocaleString()}</td>

                    {hasTotal && (
                      <>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {row.total > 0 ? row.total.toLocaleString() : "—"}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${
                          left === null ? "text-muted-foreground"
                          : left > 0 ? "text-rose-600 font-medium"
                          : "text-emerald-600"
                        }`}>
                          {left === null ? "—" : left > 0 ? left.toLocaleString() : "✓"}
                        </td>
                      </>
                    )}

                    <td className="px-3 py-2 hidden sm:table-cell w-32">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            p !== null ? barColor(p) : "bg-blue-400"
                          }`}
                          style={{ width: `${p ?? relWidth}%` }}
                        />
                      </div>
                    </td>

                    {hasTotal && (
                      <td className="px-3 py-2 pr-4 text-right tabular-nums font-semibold">
                        {p !== null ? (
                          <span className={barColor(p).replace("bg-", "text-")}>
                            {p}%
                          </span>
                        ) : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>

            {/* Totals footer */}
            <tfoot className="border-t bg-muted/40">
              <tr>
                <td className="px-3 py-2 pl-4 text-xs font-semibold text-muted-foreground">Total</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-xs">{totalDone.toLocaleString()}</td>
                {hasTotal && (
                  <>
                    <td className="px-3 py-2 text-right tabular-nums text-xs text-muted-foreground">{totalAll.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs text-rose-600 font-medium">
                      {(totalAll - totalDone).toLocaleString()}
                    </td>
                  </>
                )}
                <td className="hidden sm:table-cell" />
                {hasTotal && (
                  <td className="px-3 py-2 pr-4 text-right tabular-nums font-bold text-xs">
                    {overallPct !== null ? `${overallPct}%` : "—"}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
        {!hasTotal && (
          <p className="px-4 py-2 text-xs text-muted-foreground border-t">
            Student targets per LGA are not available in the form metadata — showing submissions only.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
