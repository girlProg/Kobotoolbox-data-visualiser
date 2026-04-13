"use client";

import { useState, useMemo } from "react";
import { StudentRecord } from "@/lib/kobo/agile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface Props {
  records: StudentRecord[];
}

const CLASS_LABELS: Record<string, string> = {
  jss1: "JSS 1",
  ss1: "SS 1",
};

export function StudentTable({ records }: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const filtered = useMemo(() => {
    if (!query.trim()) return records;
    const q = query.toLowerCase();
    return records.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.previousSchool.toLowerCase().includes(q) ||
        r.newSchool.toLowerCase().includes(q) ||
        r.admissionNo.toLowerCase().includes(q) ||
        r.studentLga.toLowerCase().includes(q) ||
        r.enumeratorLabel.toLowerCase().includes(q)
    );
  }, [records, query]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRecords = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium">
            Student records ({filtered.length.toLocaleString()})
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Search name, school, LGA…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Student</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">LGA</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Previous school</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Prev class</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">New school</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">New class</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Adm No</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">NIN</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Officer</th>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((r) => (
                <tr key={r.submissionId} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2 font-medium whitespace-nowrap">
                    {r.studentName || <span className="text-muted-foreground italic">Unknown</span>}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {r.studentLga ? (
                      <Badge variant="secondary" className="text-xs">{r.studentLga}</Badge>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-2 max-w-[200px] truncate" title={r.previousSchool}>
                    {r.previousSchool || "—"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
                    {r.previousClass || "—"}
                  </td>
                  <td className="px-4 py-2 max-w-[200px] truncate" title={r.newSchool}>
                    {r.newSchool || "—"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {r.newClass ? (
                      <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">
                        {CLASS_LABELS[r.newClass] ?? r.newClass}
                      </Badge>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {r.admissionNo || "—"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {r.hasNin ? (
                      <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">✓ captured</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {r.enumeratorLabel || "—"}
                  </td>
                </tr>
              ))}
              {pageRecords.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
            <span>
              Page {page + 1} of {totalPages} ({filtered.length.toLocaleString()} records)
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded border text-sm disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ← Prev
              </button>
              <button
                className="px-3 py-1 rounded border text-sm disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
