/**
 * GET /api/kobo/agile/overview
 *
 * Fetches submissions from every deployed AGILE form, merges them into a
 * single de-duplicated set of StudentRecord[], and returns:
 *   - records       — merged student records (de-duplicated by studentId)
 *   - choices       — choices from the MAIN form only (authoritative)
 *   - gpsPoints     — school GPS averages across all forms
 *   - formsIncluded — names of forms that were aggregated
 *
 * Why choices come from the main form only:
 *   The "Niger Agile" form is the comprehensive form — it holds every LGA's
 *   students, schools, and enumerators as choices.  Backup per-LGA forms hold
 *   only a subset, and often use different choice codes for the same entities.
 *   Merging choices from all forms inflates school / enumerator counts and
 *   produces stats that don't match what you see on the Niger Agile project
 *   page.  Using the main form's choices exclusively gives consistent totals.
 *
 * Cached for 5 minutes at the CDN/proxy layer.
 */

import { NextResponse } from "next/server";
import { koboFetch } from "@/lib/kobo/client";
import {
  KoboAssetsResponse,
  KoboAsset,
  KoboDataResponse,
  KoboSubmission,
  KoboChoice,
  ParsedGpsPoint,
} from "@/lib/kobo/types";
import {
  isAgileForm,
  parseStudentRecords,
  parseAgileGpsPoints,
  StudentRecord,
} from "@/lib/kobo/agile";
import { getLabel } from "@/lib/kobo/parsers";

export const dynamic = "force-dynamic";

export interface AgileOverviewResponse {
  records: StudentRecord[];
  choices: KoboChoice[];
  gpsPoints: ParsedGpsPoint[];
  formsIncluded: string[];
  totalForms: number;
}

/** Fetch ALL submissions for a given form UID, handling pagination. */
async function fetchAllSubmissions(uid: string): Promise<KoboSubmission[]> {
  const all: KoboSubmission[] = [];
  let nextPath: string | null =
    `/api/v2/assets/${uid}/data/?format=json&page_size=3000`;

  while (nextPath) {
    const res = await koboFetch(nextPath);
    if (!res.ok) break;
    const page: KoboDataResponse = await res.json();
    all.push(...page.results);
    if (page.next) {
      try {
        const url = new URL(page.next);
        nextPath = url.pathname + url.search;
      } catch {
        nextPath = null;
      }
    } else {
      nextPath = null;
    }
  }
  return all;
}

export async function GET() {
  // ── 1. Fetch list of deployed assets ─────────────────────────────────────
  const assetsRes = await koboFetch(
    "/api/v2/assets/?asset_type=survey&format=json&page_size=200"
  );
  if (!assetsRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: assetsRes.status }
    );
  }
  const assetsData: KoboAssetsResponse = await assetsRes.json();
  const deployed = assetsData.results.filter(
    (a) => a.deployment_status === "deployed"
  );

  // ── 2. Fetch form content in parallel; keep only AGILE forms ─────────────
  const formDetails = await Promise.all(
    deployed.map(async (asset): Promise<KoboAsset | null> => {
      try {
        const r = await koboFetch(`/api/v2/assets/${asset.uid}/?format=json`);
        if (!r.ok) return null;
        const form: KoboAsset = await r.json();
        return isAgileForm(form.content?.survey ?? []) ? form : null;
      } catch {
        return null;
      }
    })
  );

  const agileForms = formDetails.filter((f): f is KoboAsset => f !== null);

  if (agileForms.length === 0) {
    return NextResponse.json<AgileOverviewResponse>({
      records: [],
      choices: [],
      gpsPoints: [],
      formsIncluded: [],
      totalForms: 0,
    });
  }

  // ── 3. Identify the main form ─────────────────────────────────────────────
  // Priority 1: name is exactly "Niger Agile" (optional trailing whitespace).
  // Priority 2: highest submission count (the primary form always has the most).
  agileForms.sort((a, b) => {
    const aMain = /^niger\s+agile\s*$/i.test(a.name);
    const bMain = /^niger\s+agile\s*$/i.test(b.name);
    if (aMain !== bMain) return aMain ? -1 : 1;
    return (
      (b.deployment__submission_count ?? 0) -
      (a.deployment__submission_count ?? 0)
    );
  });

  const mainForm = agileForms[0];

  // ── 4. Fetch all submissions per form in parallel ─────────────────────────
  const formSubmissions = await Promise.all(
    agileForms.map(async (form) => ({
      form,
      submissions: await fetchAllSubmissions(form.uid),
    }))
  );

  // ── 5. Authoritative choices come from the main form ONLY ─────────────────
  //
  // Backup LGA forms carry only a subset of choices and sometimes use different
  // codes for the same schools / enumerators.  Merging them inflates school and
  // enumerator counts, producing totals that disagree with the project page.
  const mainChoices = (mainForm.content?.choices ?? []) as KoboChoice[];

  // Build the enumerator label map from the main form so that ALL records
  // (including those from backup forms) get consistent "Name | LGA | Phone"
  // resolution and correct LGA attribution.
  const mainEnumeratorMap = new Map<string, string>(
    mainChoices
      .filter((c) => c.list_name === "enumerator")
      .map((c) => [c.name, getLabel(c.label, c.name)])
  );

  // ── 6. Parse & de-duplicate StudentRecords ────────────────────────────────
  //
  // Process the main form first (it is agileForms[0] after the sort above).
  // Backup form records are only added when their studentId hasn't been seen —
  // i.e., students who couldn't submit on the main form due to size issues.
  // All records use the main form's enumerator map so LGA attribution is
  // consistent regardless of which form the submission came from.
  const seenStudentIds = new Set<string>();
  const mergedRecords: StudentRecord[] = [];
  const allSubmissions: KoboSubmission[] = [];

  for (const { submissions } of formSubmissions) {
    // Parse with the main form's enumerator map (consistent LGA resolution)
    const records = parseStudentRecords(submissions, mainEnumeratorMap);

    for (const record of records) {
      const key = record.studentId || `sub_${record.submissionId}`;
      if (!seenStudentIds.has(key)) {
        seenStudentIds.add(key);
        mergedRecords.push(record);
      }
    }

    allSubmissions.push(...submissions);
  }

  // ── 7. GPS points (averaged per school across all forms) ─────────────────
  const gpsPoints: ParsedGpsPoint[] = parseAgileGpsPoints(allSubmissions);

  return NextResponse.json<AgileOverviewResponse>(
    {
      records: mergedRecords,
      choices: mainChoices,   // authoritative — main form only
      gpsPoints,
      formsIncluded: agileForms.map((f) => f.name),
      totalForms: agileForms.length,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
