/**
 * GET /api/kobo/agile/overview
 *
 * Fetches submissions from every deployed AGILE form, merges them into a
 * single de-duplicated set of StudentRecord[], and returns:
 *   - records       — merged student records (de-duplicated by studentId)
 *   - choices       — merged KoboChoice[] from all forms (union by list+name)
 *   - gpsPoints     — school GPS averages across all forms
 *   - formsIncluded — names of forms that were aggregated
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

  // Sort: put the main "Niger Agile" form first so its records take priority
  // during de-duplication.
  agileForms.sort((a, b) => {
    const aMain = /^niger\s+agile\s*$/i.test(a.name);
    const bMain = /^niger\s+agile\s*$/i.test(b.name);
    return aMain ? -1 : bMain ? 1 : 0;
  });

  // ── 3. Fetch all submissions per form in parallel ─────────────────────────
  const formSubmissions = await Promise.all(
    agileForms.map(async (form) => ({
      form,
      submissions: await fetchAllSubmissions(form.uid),
    }))
  );

  // ── 4. Merge choices (union by list_name + name) ──────────────────────────
  const seenChoiceKeys = new Set<string>();
  const mergedChoices: KoboChoice[] = [];

  for (const { form } of formSubmissions) {
    for (const choice of (form.content?.choices ?? []) as KoboChoice[]) {
      const key = `${choice.list_name}::${choice.name}`;
      if (!seenChoiceKeys.has(key)) {
        seenChoiceKeys.add(key);
        mergedChoices.push(choice);
      }
    }
  }

  // ── 5. Parse & de-duplicate StudentRecords ────────────────────────────────
  const seenStudentIds = new Set<string>();
  const mergedRecords: StudentRecord[] = [];
  const allSubmissions: KoboSubmission[] = [];

  for (const { form, submissions } of formSubmissions) {
    const choices = (form.content?.choices ?? []) as KoboChoice[];
    const enumeratorMap = new Map<string, string>(
      choices
        .filter((c) => c.list_name === "enumerator")
        .map((c) => [c.name, getLabel(c.label, c.name)])
    );

    const records = parseStudentRecords(submissions, enumeratorMap);

    for (const record of records) {
      // De-duplicate: prefer the first occurrence (Niger Agile = primary form)
      const key = record.studentId || `sub_${record.submissionId}`;
      if (!seenStudentIds.has(key)) {
        seenStudentIds.add(key);
        mergedRecords.push(record);
      }
    }

    allSubmissions.push(...submissions);
  }

  // ── 6. GPS points (deduplicated by school, averaged across all forms) ─────
  const gpsPoints: ParsedGpsPoint[] = parseAgileGpsPoints(allSubmissions);

  return NextResponse.json<AgileOverviewResponse>(
    {
      records: mergedRecords,
      choices: mergedChoices,
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
