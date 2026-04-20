"use client";

import { useState } from "react";
import { dailyOfficerSummary, StudentRecord, OfficerDayEntry } from "@/lib/kobo/agile";
import { KoboChoice } from "@/lib/kobo/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, User, Calendar, Clock, UserX } from "lucide-react";

interface Props {
  records: StudentRecord[];
  choices: KoboChoice[];
}

/** Parse "Name | LGA | Phone" → { name, lga } */
function parseLabel(label: string): { name: string; lga: string } {
  const parts = label.split("|").map((p) => p.trim());
  return { name: parts[0] ?? label, lga: parts[1] ?? "" };
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function OfficerRow({ entry }: { entry: OfficerDayEntry }) {
  const [open, setOpen] = useState(false);
  const firstTime = entry.records
    .map((r) => r.submissionTime)
    .filter(Boolean)
    .sort()[0];
  const lastTime = entry.records
    .map((r) => r.submissionTime)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <>
      <tr
        className="border-b hover:bg-muted/20 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-4 py-2.5 w-5 text-muted-foreground">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>
        <td className="px-4 py-2.5">
          <span className="flex items-center gap-1.5 font-medium text-sm">
            <User size={13} className="text-muted-foreground flex-shrink-0" />
            {entry.enumeratorLabel}
          </span>
        </td>
        <td className="px-4 py-2.5">
          {entry.enumeratorLga ? (
            <Badge variant="secondary" className="text-xs">{entry.enumeratorLga}</Badge>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-right font-semibold text-sm">{entry.count}</td>
        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {firstTime ? (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatTime(firstTime)}
              {lastTime && lastTime !== firstTime && <> – {formatTime(lastTime)}</>}
            </span>
          ) : "—"}
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={5} className="bg-muted/10 px-4 pb-3 pt-0">
            <div className="overflow-x-auto rounded-md border mt-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Time</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Student</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Student LGA</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">From</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Class</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">New school</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">New class</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">NIN</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.records
                    .slice()
                    .sort((a, b) => a.submissionTime.localeCompare(b.submissionTime))
                    .map((r) => (
                      <tr key={r.submissionId} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">{formatTime(r.submissionTime)}</td>
                        <td className="px-3 py-1.5 font-medium whitespace-nowrap">{r.studentName || "—"}</td>
                        <td className="px-3 py-1.5">{r.studentLga || "—"}</td>
                        <td className="px-3 py-1.5 max-w-[140px] truncate" title={r.previousSchool}>{r.previousSchool || "—"}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap">{r.previousClass || "—"}</td>
                        <td className="px-3 py-1.5 max-w-[140px] truncate" title={r.newSchool || r.newSchoolOther}>{r.newSchool || r.newSchoolOther || "—"}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap uppercase">{r.newClass || "—"}</td>
                        <td className="px-3 py-1.5">
                          {r.hasNin ? (
                            <Badge className="text-[10px] h-4 bg-green-100 text-green-700 border-green-200">✓ NIN</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DateGroup({
  date,
  totalSubmissions,
  officers,
  absentOfficers,
}: {
  date: string;
  totalSubmissions: number;
  officers: OfficerDayEntry[];
  absentOfficers: { name: string; lga: string }[];
}) {
  const [open, setOpen] = useState(true);
  const [absentOpen, setAbsentOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Date header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <Calendar size={14} className="text-muted-foreground" />
          <span className="font-semibold text-sm">{formatDate(date)}</span>
        </span>
        <span className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{officers.length} active</Badge>
          {absentOfficers.length > 0 && (
            <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">{absentOfficers.length} absent</Badge>
          )}
          <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">{totalSubmissions} submission{totalSubmissions !== 1 ? "s" : ""}</Badge>
        </span>
      </button>

      {open && (
        <>
          {/* Active officers table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/10">
                  <th className="w-5 px-4 py-2" />
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Officer</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">LGA</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Submissions</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Active period</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((o) => (
                  <OfficerRow
                    key={o.enumeratorCode || o.enumeratorLabel}
                    entry={o}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Absent officers */}
          {absentOfficers.length > 0 && (
            <div className="border-t">
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-amber-50/60 transition-colors"
                onClick={() => setAbsentOpen((v) => !v)}
              >
                {absentOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <UserX size={13} className="text-amber-600" />
                <span className="text-xs font-medium text-amber-700">
                  {absentOfficers.length} officer{absentOfficers.length !== 1 ? "s" : ""} did not submit
                </span>
              </button>
              {absentOpen && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                  {absentOfficers.map((o) => (
                    <span
                      key={o.name}
                      className="inline-flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 bg-amber-50 text-amber-800 border-amber-200"
                    >
                      <UserX size={11} />
                      {o.name}
                      {o.lga && (
                        <span className="text-amber-500 font-normal">· {o.lga}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function OfficerDailyLog({ records, choices }: Props) {
  const [lgaFilter, setLgaFilter] = useState("");
  const [search, setSearch] = useState("");

  // Full officer roster from choices, parsed to { code, name, lga }
  const allOfficers = choices
    .filter((c) => c.list_name === "enumerator")
    .map((c) => {
      const raw = (Array.isArray(c.label) ? c.label[0] : c.label ?? "") as string;
      const { name, lga } = parseLabel(String(raw));
      return { code: c.name, name, lga };
    });

  const allLgas = Array.from(
    new Set(allOfficers.map((o) => o.lga).filter(Boolean))
  ).sort();

  const filtered = records.filter((r) => {
    if (lgaFilter && r.enumeratorLga !== lgaFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.enumeratorLabel.toLowerCase().includes(q) ||
        r.enumeratorLga.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Officer roster scoped to the active LGA filter
  const scopedRoster = lgaFilter
    ? allOfficers.filter((o) => o.lga === lgaFilter)
    : allOfficers;

  const summary = dailyOfficerSummary(filtered);

  const totalDays = summary.length;
  const totalOfficers = allOfficers.length || new Set(records.map((r) => r.enumeratorCode || r.enumeratorLabel)).size;
  const avgPerDay = totalDays > 0 ? Math.round(records.length / totalDays) : 0;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total officers", value: totalOfficers },
          { label: "Active days", value: totalDays },
          { label: "Total submissions", value: records.length.toLocaleString() },
          { label: "Avg per active day", value: avgPerDay },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search officer name or LGA…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={lgaFilter}
            onChange={(e) => setLgaFilter(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All LGAs</option>
            {allLgas.map((lga) => (
              <option key={lga} value={lga}>{lga}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Daily groups */}
      {summary.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No submissions match the current filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {summary.map(({ date, totalSubmissions, officers }) => {
            const activeCodes = new Set(officers.map((o) => o.enumeratorCode).filter(Boolean));
            const absent = scopedRoster.filter((o) => !activeCodes.has(o.code));
            return (
              <DateGroup
                key={date}
                date={date}
                totalSubmissions={totalSubmissions}
                officers={officers}
                absentOfficers={absent}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
