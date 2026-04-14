"use client";

import {
  schoolCoverageStats,
  enumeratorCoverageStats,
  StudentRecord,
} from "@/lib/kobo/agile";
import { KoboChoice } from "@/lib/kobo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SchoolCoverageCardProps {
  records: StudentRecord[];
  choices: KoboChoice[];
}

export function SchoolCoverageCard({ records, choices }: SchoolCoverageCardProps) {
  const { total, withSubmissions, withoutSubmissions, rate } =
    schoolCoverageStats(records, choices);

  if (total === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Schools covered</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold">{rate}%</span>
          <span className="text-sm text-muted-foreground">
            {withSubmissions.toLocaleString()} / {total.toLocaleString()} schools
          </span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden flex">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${rate}%` }}
            title={`${withSubmissions} with submissions`}
          />
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500" />
            Submitted: {withSubmissions.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" />
            No submissions yet: {withoutSubmissions.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface EnumeratorCoverageCardProps {
  records: StudentRecord[];
  choices: KoboChoice[];
  projectLga: string;
}

export function EnumeratorCoverageCard({
  records,
  choices,
  projectLga,
}: EnumeratorCoverageCardProps) {
  const { total, withSubmissions, withoutSubmissions, rate } =
    enumeratorCoverageStats(records, choices, projectLga);

  if (total === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">EMIS officers active</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold">{rate}%</span>
          <span className="text-sm text-muted-foreground">
            {withSubmissions.toLocaleString()} / {total.toLocaleString()} officers
          </span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${rate}%` }}
            title={`${withSubmissions} have submitted`}
          />
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            Active: {withSubmissions.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" />
            Not yet submitted: {withoutSubmissions.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
