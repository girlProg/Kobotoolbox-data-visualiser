"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { KoboAsset, KoboDataResponse, KoboChoice } from "@/lib/kobo/types";
import {
  extractSelectFields,
  aggregateChoices,
  parseGpsSubmissions,
  getLabel,
} from "@/lib/kobo/parsers";
import {
  isAgileForm,
  parseStudentRecords,
} from "@/lib/kobo/agile";
import { SelectOneChart } from "@/components/project/SelectOneChart";
import { SelectMultipleChart } from "@/components/project/SelectMultipleChart";
import { PieChartField } from "@/components/project/PieChartField";
import { StatCard } from "@/components/dashboard/StatCard";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// AGILE-specific components
import { AgileStatCards } from "@/components/agile/AgileStatCards";
import { EnumeratorTable } from "@/components/agile/EnumeratorTable";
import { NewClassChart, PreviousClassChart } from "@/components/agile/NewClassChart";
import { SourceSchoolsChart, DestinationSchoolsChart } from "@/components/agile/SchoolFlowCharts";
import { NinCaptureBar } from "@/components/agile/NinCaptureBar";
import { StudentTable } from "@/components/agile/StudentTable";

const SubmissionsMap = dynamic(
  () =>
    import("@/components/project/SubmissionsMap").then(
      (m) => m.SubmissionsMap
    ),
  { ssr: false, loading: () => <Skeleton className="h-[440px] w-full rounded-xl" /> }
);

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProjectPage({
  params,
}: {
  params: { uid: string };
}) {
  const { uid } = params;

  const { data: formDef, error: formError, isLoading: formLoading } =
    useSWR<KoboAsset>(`/api/kobo/assets/${uid}`, fetcher);

  const { data: submissionData, error: dataError, isLoading: dataLoading } =
    useSWR<KoboDataResponse>(`/api/kobo/assets/${uid}/data`, fetcher);

  const survey = formDef?.content?.survey ?? [];
  const choices = formDef?.content?.choices ?? [];
  const submissions = submissionData?.results ?? [];

  const { selectOneFields, selectMultipleFields, gpsFields } =
    extractSelectFields(survey);

  // Build enumerator label map for AGILE forms
  const enumeratorChoiceMap = new Map<string, string>(
    (choices as KoboChoice[])
      .filter((c) => c.list_name === "enumerator")
      .map((c) => [c.name, getLabel(c.label, c.name)])
  );

  // Detect AGILE student-tracking form
  const agile = isAgileForm(survey);
  const studentRecords = agile
    ? parseStudentRecords(submissions, enumeratorChoiceMap)
    : [];

  // GPS
  const gpsFieldNames = gpsFields.length > 0
    ? gpsFields.map((f) => f.name)
    : ["_geolocation"];
  const gpsPoints = parseGpsSubmissions(submissions, gpsFieldNames[0]);

  const isLoading = formLoading || dataLoading;
  const hasError = formError || dataError;
  const projectName = formDef?.name ?? "Project";

  // For non-AGILE forms: filter out AGILE-specific fields from generic charts
  const agileFieldNames = new Set([
    "enumerator", "old_school", "student_id", "new_class",
    "new_school_lga", "new_school_id",
  ]);
  const genericSelectOne = agile
    ? selectOneFields.filter((f) => !agileFieldNames.has(f.name))
    : selectOneFields;
  const genericSelectMultiple = agile
    ? selectMultipleFields.filter((f) => !agileFieldNames.has(f.name))
    : selectMultipleFields;

  return (
    <>
      <Topbar title={projectName} />
      <main className="flex-1 p-6 space-y-8 bg-gray-50">
        {hasError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load project data.</AlertDescription>
          </Alert>
        )}

        {/* ── AGILE Student Tracking Section ────────────────────────── */}
        {agile && (
          <>
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Student overview
              </h2>
              <AgileStatCards records={studentRecords} loading={isLoading} />
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Class transitions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                  </>
                ) : (
                  <>
                    <NewClassChart records={studentRecords} />
                    <PreviousClassChart records={studentRecords} />
                  </>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                School transitions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-80 rounded-xl" />
                    <Skeleton className="h-80 rounded-xl" />
                  </>
                ) : (
                  <>
                    <SourceSchoolsChart records={studentRecords} />
                    <DestinationSchoolsChart records={studentRecords} />
                  </>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Data quality
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  <Skeleton className="h-36 rounded-xl" />
                ) : (
                  <NinCaptureBar records={studentRecords} />
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                EMIS officers
              </h2>
              {isLoading ? (
                <Skeleton className="h-48 rounded-xl" />
              ) : (
                <EnumeratorTable records={studentRecords} />
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Student records
              </h2>
              {isLoading ? (
                <Skeleton className="h-80 rounded-xl" />
              ) : (
                <StudentTable records={studentRecords} />
              )}
            </section>
          </>
        )}

        {/* ── Generic form stats (non-AGILE, or extra fields) ──────── */}
        {!agile && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              title="Total submissions"
              value={submissionData?.count ?? 0}
              loading={isLoading}
            />
            <StatCard
              title="GPS data points"
              value={gpsPoints.length}
              loading={isLoading}
            />
          </div>
        )}

        {!agile && isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!agile && !isLoading &&
          (genericSelectOne.length > 0 || genericSelectMultiple.length > 0) && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Response distributions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {genericSelectOne.map((field) => {
                  const data = aggregateChoices(submissions, field, false, choices);
                  if (data.length === 0) return null;
                  const title = getLabel(field.label, field.name);
                  return data.length <= 6 ? (
                    <PieChartField key={field.name} title={title} data={data} />
                  ) : (
                    <SelectOneChart key={field.name} title={title} data={data} />
                  );
                })}
                {genericSelectMultiple.map((field) => {
                  const data = aggregateChoices(submissions, field, true, choices);
                  if (data.length === 0) return null;
                  const title = getLabel(field.label, field.name);
                  return (
                    <SelectMultipleChart key={field.name} title={title} data={data} />
                  );
                })}
              </div>
            </div>
          )}

        {/* ── GPS Map (all forms) ───────────────────────────────────── */}
        {!isLoading && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {agile ? "Data collection locations" : "Location"}
            </h2>
            <SubmissionsMap points={gpsPoints} />
          </section>
        )}
      </main>
    </>
  );
}
