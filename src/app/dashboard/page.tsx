"use client";

import useSWR from "swr";
import { KoboAsset, KoboDataResponse } from "@/lib/kobo/types";
import { buildTimeSeries } from "@/lib/kobo/parsers";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProjectSubmissionBar } from "@/components/dashboard/ProjectSubmissionBar";
import { SubmissionTimeSeries } from "@/components/dashboard/SubmissionTimeSeries";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GradCapIcon } from "@/components/agile/GradCapIcon";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data: assets, error, isLoading } = useSWR<KoboAsset[]>(
    "/api/kobo/assets",
    fetcher
  );

  const totalSubmissions = assets?.reduce(
    (sum, a) => sum + (a.deployment__submission_count ?? 0),
    0
  ) ?? 0;

  const deployedCount = assets?.filter(
    (a) => a.deployment_status === "deployed"
  ).length ?? 0;

  // For time-series, pull from the first project with submissions
  const firstWithSubs = assets?.find(
    (a) => a.deployment__submission_count > 0
  );
  const { data: firstProjectData } = useSWR<KoboDataResponse>(
    firstWithSubs ? `/api/kobo/assets/${firstWithSubs.uid}/data` : null,
    fetcher
  );

  const timeSeries = firstProjectData
    ? buildTimeSeries(firstProjectData.results)
    : [];

  // Sort assets by submission count for the bar chart
  const sortedAssets = assets
    ? [...assets].sort(
        (a, b) =>
          (b.deployment__submission_count ?? 0) -
          (a.deployment__submission_count ?? 0)
      )
    : [];

  const lgasWithData = assets?.filter(
    (a) => a.deployment__submission_count > 0
  ).length ?? 0;

  return (
    <>
      <Topbar title="Niger State AGILE — Overview" />
      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load projects. Check your KOBO_TOKEN environment variable.
            </AlertDescription>
          </Alert>
        )}

        {/* Banner */}
        {!isLoading && assets && assets.length > 0 && (
          <div className="rounded-xl bg-blue-600 text-white p-4 flex items-center gap-4">
            <GradCapIcon />
            <div>
              <p className="font-semibold text-base">
                Student Transition Tracking — Niger State
              </p>
              <p className="text-blue-200 text-sm">
                Monitoring primary-to-secondary school transitions across{" "}
                {assets.length} LGAs in Niger State (AGILE Programme)
              </p>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Total students tracked"
            value={totalSubmissions.toLocaleString()}
            loading={isLoading}
          />
          <StatCard
            title="LGAs active"
            value={lgasWithData}
            loading={isLoading}
          />
          <StatCard
            title="Total LGA projects"
            value={assets?.length ?? 0}
            loading={isLoading}
          />
          <StatCard
            title="Deployed projects"
            value={deployedCount}
            loading={isLoading}
          />
        </div>

        {/* Per-LGA submission bar chart */}
        {isLoading ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : sortedAssets.length > 0 ? (
          <ProjectSubmissionBar assets={sortedAssets} />
        ) : null}

        {/* Time-series if available */}
        {timeSeries.length > 0 && (
          <SubmissionTimeSeries data={timeSeries} />
        )}
      </main>
    </>
  );
}
