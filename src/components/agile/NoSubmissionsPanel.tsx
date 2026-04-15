"use client";

import {
  lgasWithNoSubmissions,
  sourceLgasWithNoSubmissions,
  enumeratorsWithNoSubmissions,
  StudentRecord,
} from "@/lib/kobo/agile";
import { KoboChoice } from "@/lib/kobo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, UserX } from "lucide-react";

interface Props {
  records: StudentRecord[];
  choices: KoboChoice[];
  projectLga: string;
}

function EmptyBadge({ count, label }: { count: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
      {count} {label}
    </span>
  );
}

export function NoSubmissionsPanel({ records, choices, projectLga }: Props) {
  // When projectLga is "" (overview / all-LGA context), check which of the
  // 22 source LGAs have no submissions at all.  For single-LGA projects,
  // use the original destination-LGA check (new_school_lga choices).
  const missingLgas = projectLga === ""
    ? sourceLgasWithNoSubmissions(records)
    : lgasWithNoSubmissions(records, choices);
  const missingOfficers = enumeratorsWithNoSubmissions(records, choices, projectLga);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* LGAs with no submissions */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              LGAs with no students yet
            </span>
            {missingLgas.length > 0 && (
              <EmptyBadge count={missingLgas.length} label="pending" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto max-h-48 pr-2">
          {missingLgas.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              All LGAs have at least one student — great coverage!
            </p>
          ) : (
            <ul className="space-y-1">
              {missingLgas.map((lga) => (
                <li
                  key={lga}
                  className="text-xs text-foreground flex items-center gap-1.5 py-0.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {lga}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* EMIS officers with no submissions */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <UserX className="h-4 w-4 text-rose-500 shrink-0" />
              Officers not yet submitted
            </span>
            {missingOfficers.length > 0 && (
              <EmptyBadge count={missingOfficers.length} label="pending" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto max-h-48 pr-2">
          {missingOfficers.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              All officers have submitted — full participation!
            </p>
          ) : (
            <ul className="space-y-1">
              {missingOfficers.map((name) => (
                <li
                  key={name}
                  className="text-xs text-foreground flex items-center gap-1.5 py-0.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
