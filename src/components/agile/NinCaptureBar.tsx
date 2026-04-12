"use client";

import { ninCaptureStats, StudentRecord } from "@/lib/kobo/agile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  records: StudentRecord[];
}

export function NinCaptureBar({ records }: Props) {
  const { total, withNin, withoutNin, rate } = ninCaptureStats(records);
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">NIN capture rate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold">{rate}%</span>
          <span className="text-sm text-muted-foreground">
            {withNin.toLocaleString()} / {total.toLocaleString()} students
          </span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden flex">
          <div
            className="h-full bg-purple-500 transition-all"
            style={{ width: `${rate}%` }}
            title={`${withNin} with NIN`}
          />
          <div
            className="h-full bg-muted flex-1"
            title={`${withoutNin} without NIN`}
          />
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-purple-500" />
            With NIN: {withNin.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" />
            Without NIN: {withoutNin.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
