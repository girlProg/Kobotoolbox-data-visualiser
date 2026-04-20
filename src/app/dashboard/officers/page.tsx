"use client";

import useSWR from "swr";
import { StudentRecord } from "@/lib/kobo/agile";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OfficerDailyLog } from "@/components/agile/OfficerDailyLog";

import type { AgileOverviewResponse } from "@/app/api/kobo/agile/overview/route";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function OfficersPage() {
  const { data, error, isLoading } = useSWR<AgileOverviewResponse>(
    "/api/kobo/agile/overview",
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  );

  const records: StudentRecord[] = data?.records ?? [];

  return (
    <>
      <Topbar title="Niger State AGILE — EMIS Officers" />
      <main className="flex-1 p-4 md:p-6 space-y-6 bg-gray-50">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load data. Check your KOBO_TOKEN environment variable.
            </AlertDescription>
          </Alert>
        )}

        <section className="space-y-1">
          <h1 className="text-lg font-semibold">EMIS Officer Daily Activity</h1>
          <p className="text-sm text-muted-foreground">
            Daily breakdown of which officers submitted records and the students
            they captured. Click a date to expand, then click an officer to see
            their individual submissions.
          </p>
        </section>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-12 rounded-xl" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <OfficerDailyLog records={records} />
        )}
      </main>
    </>
  );
}
