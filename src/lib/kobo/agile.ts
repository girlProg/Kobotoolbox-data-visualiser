/**
 * AGILE Niger State – Student Transition Tracking
 *
 * Form purpose: Track students transitioning from primary to secondary school
 * across 22 LGAs in Niger State. One KoboToolbox project per LGA.
 *
 * Key fields (may be group-prefixed, e.g. pg_details/new_class):
 *   enumerator        – EMIS officer (label: "Name | LGA | Phone")
 *   old_school        – previous primary school code
 *   student_id        – selected student code
 *   c_name            – calculated: student full name
 *   c_lga             – calculated: student LGA
 *   c_school          – calculated: previous school name
 *   c_adm             – calculated: admission number
 *   c_class           – calculated: previous class (e.g. "Primary 6")
 *   c_caregiver       – calculated: caregiver name
 *   c_phone           – calculated: caregiver phone
 *   new_class         – jss1 | ss1
 *   new_school_lga    – LGA of new school
 *   new_school_id     – new school code
 *   new_school_other  – free-text if school not in list
 *   student_nin       – optional 11-digit NIN
 *   gps / pg_cert/gps – GPS coordinates
 */

import { KoboSubmission, KoboSurveyField, KoboChoice, ParsedGpsPoint } from "./types";
import { parseGpsString } from "./parsers";

// ── Field name resolution (handles group prefixes) ─────────────────────────

const AGILE_FIELDS = [
  "enumerator",
  "old_school",
  "student_id",
  "c_name",
  "c_lga",
  "c_school",
  "c_adm",
  "c_class",
  "c_caregiver",
  "c_phone",
  "new_class",
  "new_school_lga",
  "new_school_id",
  "new_school_other",
  "student_nin",
  "gps",
] as const;

export type AgileFieldName = (typeof AGILE_FIELDS)[number];

/** Get a field value from a submission, trying both bare and group-prefixed keys */
export function getField(sub: KoboSubmission, field: AgileFieldName): string {
  // Direct
  if (sub[field] != null && sub[field] !== "") return String(sub[field]);
  // Try any group-prefixed variant (e.g. pg_details/c_name)
  for (const key of Object.keys(sub)) {
    if (key.endsWith("/" + field) && sub[key] != null && sub[key] !== "") {
      return String(sub[key]);
    }
  }
  return "";
}

// ── AGILE form detection ────────────────────────────────────────────────────

/** Returns true if a form's survey fields look like an AGILE student-tracking form */
export function isAgileForm(survey: KoboSurveyField[]): boolean {
  const names = new Set(survey.map((f) => f.name));
  return (
    names.has("student_id") &&
    names.has("new_class") &&
    names.has("c_name")
  );
}

// ── Derived data types ──────────────────────────────────────────────────────

export interface StudentRecord {
  submissionId: number;
  submissionTime: string;
  enumeratorCode: string;
  enumeratorLabel: string;
  enumeratorLga: string;
  studentId: string;
  studentName: string;
  studentLga: string;
  previousSchoolCode: string; // raw old_school choice code
  previousSchool: string;     // human-readable name from c_school
  previousClass: string;
  admissionNo: string;
  caregiverName: string;
  caregiverPhone: string;
  newClass: string;
  newSchoolLga: string;
  newSchool: string;
  newSchoolOther: string;
  nin: string;
  hasNin: boolean;
}

export interface EnumeratorStat {
  code: string;
  label: string;
  lga: string;
  count: number;
}

export interface SchoolCount {
  name: string;
  count: number;
}

export interface ClassTransition {
  previousClass: string;
  newClass: string;
  count: number;
}

// ── Parsers ─────────────────────────────────────────────────────────────────

/** Parse enumerator label "Name | LGA | Phone" → { name, lga } */
function parseEnumeratorLabel(label: string): { name: string; lga: string } {
  const parts = label.split("|").map((p) => p.trim());
  return { name: parts[0] ?? label, lga: parts[1] ?? "" };
}

/** Build a full list of StudentRecord from raw KoboToolbox submissions */
export function parseStudentRecords(
  submissions: KoboSubmission[],
  enumeratorChoiceMap: Map<string, string> // code → label
): StudentRecord[] {
  return submissions.map((sub) => {
    const enumCode = getField(sub, "enumerator");
    const enumLabel = enumeratorChoiceMap.get(enumCode) ?? enumCode;
    const { name: enumName, lga: enumLga } = parseEnumeratorLabel(enumLabel);

    const newSchoolRaw = getField(sub, "new_school_id");
    const newSchoolOther = getField(sub, "new_school_other");
    const nin = getField(sub, "student_nin");

    return {
      submissionId: sub._id,
      submissionTime: sub._submission_time ?? "",
      enumeratorCode: enumCode,
      enumeratorLabel: enumName,
      enumeratorLga: enumLga,
      studentId: getField(sub, "student_id"),
      studentName: getField(sub, "c_name"),
      studentLga: getField(sub, "c_lga"),
      previousSchoolCode: getField(sub, "old_school"),
      previousSchool: getField(sub, "c_school"),
      previousClass: getField(sub, "c_class"),
      admissionNo: getField(sub, "c_adm"),
      caregiverName: getField(sub, "c_caregiver"),
      caregiverPhone: getField(sub, "c_phone"),
      newClass: getField(sub, "new_class"),
      newSchoolLga: getField(sub, "new_school_lga"),
      newSchool: newSchoolOther || newSchoolRaw,
      newSchoolOther,
      nin,
      hasNin: nin.length === 11,
    };
  });
}

/** Submissions per enumerator */
export function groupByEnumerator(records: StudentRecord[]): EnumeratorStat[] {
  const map = new Map<string, EnumeratorStat>();
  for (const r of records) {
    const key = r.enumeratorCode || r.enumeratorLabel || "Unknown";
    if (!map.has(key)) {
      map.set(key, {
        code: r.enumeratorCode,
        label: r.enumeratorLabel || r.enumeratorCode || "Unknown",
        lga: r.enumeratorLga,
        count: 0,
      });
    }
    map.get(key)!.count++;
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

/** Top N source (previous) schools */
export function topSourceSchools(
  records: StudentRecord[],
  n = 10
): SchoolCount[] {
  const freq: Record<string, number> = {};
  for (const r of records) {
    if (!r.previousSchool) continue;
    freq[r.previousSchool] = (freq[r.previousSchool] ?? 0) + 1;
  }
  return Object.entries(freq)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** Top N destination (new) schools */
export function topDestinationSchools(
  records: StudentRecord[],
  n = 10
): SchoolCount[] {
  const freq: Record<string, number> = {};
  for (const r of records) {
    const school = r.newSchoolOther || r.newSchool;
    if (!school) continue;
    freq[school] = (freq[school] ?? 0) + 1;
  }
  return Object.entries(freq)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** Class breakdown: new_class value counts */
export function newClassBreakdown(
  records: StudentRecord[]
): { label: string; count: number }[] {
  const CLASS_LABELS: Record<string, string> = {
    jss1: "JSS 1",
    ss1: "SS 1",
  };
  const freq: Record<string, number> = {};
  for (const r of records) {
    if (!r.newClass) continue;
    freq[r.newClass] = (freq[r.newClass] ?? 0) + 1;
  }
  return Object.entries(freq)
    .map(([code, count]) => ({ label: CLASS_LABELS[code] ?? code, count }))
    .sort((a, b) => b.count - a.count);
}

/** Previous class breakdown */
export function previousClassBreakdown(
  records: StudentRecord[]
): { label: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const r of records) {
    if (!r.previousClass) continue;
    freq[r.previousClass] = (freq[r.previousClass] ?? 0) + 1;
  }
  return Object.entries(freq)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/** NIN capture stats */
export function ninCaptureStats(records: StudentRecord[]) {
  const total = records.length;
  const withNin = records.filter((r) => r.hasNin).length;
  const rate = total > 0 ? Math.round((withNin / total) * 100) : 0;
  return { total, withNin, withoutNin: total - withNin, rate };
}

export interface CoverageStats {
  total: number;
  withSubmissions: number;
  withoutSubmissions: number;
  rate: number; // % that have at least one submission
}

/**
 * Schools coverage: how many source schools (old_school choices) have
 * at least one student submission vs how many have none yet.
 */
export function schoolCoverageStats(
  records: StudentRecord[],
  choices: KoboChoice[]
): CoverageStats {
  const allSchools = choices.filter((c) => c.list_name === "old_school");
  const total = allSchools.length;
  if (total === 0) return { total: 0, withSubmissions: 0, withoutSubmissions: 0, rate: 0 };

  // Match by the school name stored in c_school (human-readable) against
  // choice labels, or fall back to matching choice codes against old_school field
  const schoolCodesWithSubs = new Set(
    records.map((r) => r.previousSchoolCode).filter(Boolean)
  );
  // Also track by previousSchool name in case code isn't stored
  const schoolNamesWithSubs = new Set(
    records.map((r) => r.previousSchool.toLowerCase()).filter(Boolean)
  );

  const withSubmissions = allSchools.filter((c) => {
    if (schoolCodesWithSubs.has(c.name)) return true;
    const label = (Array.isArray(c.label) ? c.label[0] : c.label ?? "").toLowerCase();
    return label && schoolNamesWithSubs.has(label);
  }).length;

  const withoutSubmissions = total - withSubmissions;
  const rate = Math.round((withSubmissions / total) * 100);
  return { total, withSubmissions, withoutSubmissions, rate };
}

/**
 * Enumerator coverage: how many EMIS officers have submitted at least once
 * vs how many haven't submitted yet.
 *
 * When projectLga is provided, filters the enumerator list to that LGA
 * using the "Name | LGA | Phone" label format.
 * When projectLga is empty (""), counts ALL enumerators in the list —
 * use this for per-LGA KoboToolbox projects where the form already contains
 * only the relevant officers (e.g. all "Niger Agile …" projects).
 */
export function enumeratorCoverageStats(
  records: StudentRecord[],
  choices: KoboChoice[],
  projectLga: string
): CoverageStats {
  const allEnumerators = choices.filter((c) => c.list_name === "enumerator");

  // Only filter by LGA when a specific LGA is provided
  const targetEnumerators =
    projectLga.trim() === ""
      ? allEnumerators
      : allEnumerators.filter((c) => {
          const label = Array.isArray(c.label) ? c.label[0] : c.label ?? "";
          const { lga } = parseEnumeratorLabel(String(label));
          return lga.toLowerCase() === projectLga.toLowerCase();
        });

  const total = targetEnumerators.length;
  if (total === 0) return { total: 0, withSubmissions: 0, withoutSubmissions: 0, rate: 0 };

  const codesWithSubs = new Set(records.map((r) => r.enumeratorCode).filter(Boolean));
  const withSubmissions = targetEnumerators.filter((c) => codesWithSubs.has(c.name)).length;
  const withoutSubmissions = total - withSubmissions;
  const rate = Math.round((withSubmissions / total) * 100);
  return { total, withSubmissions, withoutSubmissions, rate };
}

/**
 * Derive the LGA name for a project from its submissions (most common
 * enumeratorLga), falling back to parsing the asset name.
 */
export function deriveProjectLga(
  records: StudentRecord[],
  assetName: string
): string {
  if (records.length > 0) {
    const freq: Record<string, number> = {};
    for (const r of records) {
      const lga = r.enumeratorLga || r.studentLga;
      if (lga) freq[lga] = (freq[lga] ?? 0) + 1;
    }
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    if (top) return top[0];
  }
  // Fallback: last segment of asset name, e.g. "niger_agile_Lapai" → "Lapai"
  const parts = assetName.split(/[_\s-]/);
  return parts[parts.length - 1] ?? assetName;
}

/**
 * Returns the names of destination LGAs (new_school_lga choices) that have
 * no student submissions pointing to them yet.
 */
export function lgasWithNoSubmissions(
  records: StudentRecord[],
  choices: KoboChoice[]
): string[] {
  const allLgas = choices.filter((c) => c.list_name === "new_school_lga");
  if (allLgas.length === 0) return [];
  const lgasWithSubs = new Set(records.map((r) => r.newSchoolLga).filter(Boolean));
  return allLgas
    .filter((c) => !lgasWithSubs.has(c.name))
    .map((c) => (Array.isArray(c.label) ? c.label[0] : c.label ?? c.name) as string)
    .filter(Boolean)
    .sort();
}

/**
 * Returns the names of EMIS officers who have not submitted anything yet.
 * When projectLga is "" all enumerators are considered (Niger Agile projects).
 */
export function enumeratorsWithNoSubmissions(
  records: StudentRecord[],
  choices: KoboChoice[],
  projectLga: string
): string[] {
  const allEnumerators = choices.filter((c) => c.list_name === "enumerator");
  const targetEnumerators =
    projectLga.trim() === ""
      ? allEnumerators
      : allEnumerators.filter((c) => {
          const label = Array.isArray(c.label) ? c.label[0] : c.label ?? "";
          const { lga } = parseEnumeratorLabel(String(label));
          return lga.toLowerCase() === projectLga.toLowerCase();
        });

  const codesWithSubs = new Set(records.map((r) => r.enumeratorCode).filter(Boolean));
  return targetEnumerators
    .filter((c) => !codesWithSubs.has(c.name))
    .map((c) => {
      const raw = (Array.isArray(c.label) ? c.label[0] : c.label ?? c.name) as string;
      return parseEnumeratorLabel(raw).name || raw;
    })
    .filter(Boolean)
    .sort();
}

/**
 * GPS points for AGILE forms, grouped by previous school.
 * Each point is the average lat/lng of all submissions from that school,
 * labelled with the school name and carrying a student count.
 */
export function parseAgileGpsPoints(submissions: KoboSubmission[]): ParsedGpsPoint[] {
  // Map from school code → { name, lats, lngs }
  const schools = new Map<string, { name: string; lats: number[]; lngs: number[] }>();

  for (const sub of submissions) {
    const schoolCode = getField(sub, "old_school");
    const schoolName = getField(sub, "c_school") || schoolCode || "Unknown school";

    // Resolve GPS field (bare or group-prefixed)
    let rawGps: string | null = null;
    for (const key of Object.keys(sub)) {
      const bare = key.split("/").pop() ?? key;
      if (bare === "gps" && sub[key] != null && sub[key] !== "") {
        rawGps = String(sub[key]);
        break;
      }
    }
    // Also try _geolocation array
    if (!rawGps) {
      const geo = sub._geolocation;
      if (Array.isArray(geo) && geo.length >= 2) {
        const [lat, lng] = geo as [number, number];
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          rawGps = `${lat} ${lng}`;
        }
      }
    }
    if (!rawGps) continue;

    const pt = parseGpsString(rawGps);
    if (!pt) continue;

    const key = schoolCode || schoolName;
    if (!schools.has(key)) {
      schools.set(key, { name: schoolName, lats: [], lngs: [] });
    }
    schools.get(key)!.lats.push(pt.lat);
    schools.get(key)!.lngs.push(pt.lng);
  }

  return Array.from(schools.values()).map(({ name, lats, lngs }) => {
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      lat: avg(lats),
      lng: avg(lngs),
      label: name,
      count: lats.length,
    };
  });
}

/** LGA breakdown of students */
export function studentsByLga(
  records: StudentRecord[]
): { label: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const r of records) {
    const lga = r.studentLga || r.enumeratorLga || "Unknown";
    freq[lga] = (freq[lga] ?? 0) + 1;
  }
  return Object.entries(freq)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
