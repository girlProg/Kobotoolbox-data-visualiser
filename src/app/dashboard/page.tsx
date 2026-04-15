"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { KoboChoice } from "@/lib/kobo/types";
import { StudentRecord } from "@/lib/kobo/agile";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GradCapIcon } from "@/components/agile/GradCapIcon";

// AGILE sections (same components as the project page)
import { AgileStatCards } from "@/components/agile/AgileStatCards";
import { NinCaptureBar } from "@/components/agile/NinCaptureBar";
import { SchoolCoverageCard, EnumeratorCoverageCard, DuplicatesCard } from "@/components/agile/CoverageCards";
import { LgaProgressTable } from "@/components/agile/LgaProgressTable";
import { NewClassChart, PreviousClassChart } from "@/components/agile/NewClassChart";
import { SourceSchoolsChart, DestinationSchoolsChart } from "@/components/agile/SchoolFlowCharts";
import { EnumeratorTable } from "@/components/agile/EnumeratorTable";

import type { AgileOverviewResponse } from "@/app/api/kobo/agile/overview/route";

const SubmissionsMap = dynamic(
  () =>
    import("@/components/project/SubmissionsMap").then((m) => m.SubmissionsMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[440px] w-full rounded-xl" />,
  }
);

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const {
    data,
    error,
    isLoading,
  } = useSWR<AgileOverviewResponse>("/api/kobo/agile/overview", fetcher, {
    refreshInterval: 5 * 60 * 1000,
  });

  const records: StudentRecord[] = data?.records ?? [];
  const choices: KoboChoice[] = (data?.choices ?? []) as KoboChoice[];
  const gpsPoints = data?.gpsPoints ?? [];

  return (
    <>
      <Topbar title="Niger State AGILE — Overview" />
      <main className="flex-1 p-4 md:p-6 space-y-6 md:space-y-8 bg-gray-50">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load overview data. Check your KOBO_TOKEN environment
              variable.
            </AlertDescription>
          </Alert>
        )}

        {/* Banner */}
        <div className="rounded-xl bg-blue-600 text-white p-4 flex items-center gap-4">
          <GradCapIcon />
          <div>
            <p className="font-semibold text-base">
              Student Transition Tracking — Niger State
            </p>
            <p className="text-blue-200 text-sm">
              {isLoading
                ? "Loading data across all 22 LGAs…"
                : `${records.length.toLocaleString()} students tracked across ${
                    data?.totalForms ?? 0
                  } AGILE form${data?.totalForms !== 1 ? "s" : ""} (Niger State AGILE Programme)`}
            </p>
          </div>
        </div>

        {/* 1 · Student overview */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Student overview
          </h2>
          <AgileStatCards records={records} loading={isLoading} />
        </section>

        {/* 2 · Data quality */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Data quality
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-36 rounded-xl" />
                <Skeleton className="h-36 rounded-xl" />
                <Skeleton className="h-36 rounded-xl" />
              </>
            ) : (
              <>
                <NinCaptureBar records={records} />
                <SchoolCoverageCard records={records} choices={choices} />
                {/* projectLga="" → count all enumerators across every LGA */}
                <EnumeratorCoverageCard
                  records={records}
                  choices={choices}
                  projectLga=""
                />
                <DuplicatesCard records={records} />
              </>
            )}
          </div>
        </section>

        {/* 3 · Data collection locations */}
        {!isLoading && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Data collection locations
            </h2>
            <SubmissionsMap points={gpsPoints} showStateBoundary />
          </section>
        )}

        {/* 4 · Progress by LGA */}
        {!isLoading && records.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Progress by LGA
            </h2>
            <LgaProgressTable records={records} choices={choices} />
          </section>
        )}

        {/* 5 · Class transitions */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Class transitions
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </>
            ) : (
              <>
                <NewClassChart records={records} />
                <PreviousClassChart records={records} />
              </>
            )}
          </div>
        </section>

        {/* 6 · School transitions */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            School transitions
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-80 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
              </>
            ) : (
              <>
                <SourceSchoolsChart records={records} />
                <DestinationSchoolsChart records={records} />
              </>
            )}
          </div>
        </section>

        {/* 7 · EMIS officers */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            EMIS officers
          </h2>
          {isLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (
            <EnumeratorTable records={records} />
          )}
        </section>
      </main>
    </>
  );
}
