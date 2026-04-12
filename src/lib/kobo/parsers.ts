import {
  KoboSurveyField,
  KoboChoice,
  KoboSubmission,
  ParsedGpsPoint,
  AggregatedChoice,
  TimeSeriesPoint,
} from "./types";

export function getLabel(
  label: string | string[] | undefined,
  fallback: string
): string {
  if (!label) return fallback;
  if (Array.isArray(label)) return label[0] ?? fallback;
  return label;
}

export function extractSelectFields(survey: KoboSurveyField[]) {
  return {
    selectOneFields: survey.filter((f) => f.type === "select_one"),
    selectMultipleFields: survey.filter((f) => f.type === "select_multiple"),
    gpsFields: survey.filter(
      (f) => f.type === "geopoint" || f.type === "gps"
    ),
  };
}

export function aggregateChoices(
  submissions: KoboSubmission[],
  field: KoboSurveyField,
  isMultiple: boolean,
  choices: KoboChoice[]
): AggregatedChoice[] {
  const freq: Record<string, number> = {};

  for (const sub of submissions) {
    const raw = sub[field.name];
    if (raw == null || raw === "") continue;
    const tokens = isMultiple
      ? String(raw).split(" ").filter(Boolean)
      : [String(raw)];

    for (const token of tokens) {
      freq[token] = (freq[token] ?? 0) + 1;
    }
  }

  const listName = field.select_from_list_name ?? "";
  const choiceMap = new Map<string, string>();
  for (const c of choices) {
    if (c.list_name === listName) {
      choiceMap.set(c.name, getLabel(c.label, c.name));
    }
  }

  return Object.entries(freq)
    .map(([name, count]) => ({
      label: choiceMap.get(name) ?? name,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export function parseGpsString(raw: string): ParsedGpsPoint | null {
  const parts = raw.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

export function parseGpsSubmissions(
  submissions: KoboSubmission[],
  gpsFieldName: string
): ParsedGpsPoint[] {
  const points: ParsedGpsPoint[] = [];
  for (const sub of submissions) {
    // KoboToolbox also stores geolocation as _geolocation: [lat, lng]
    if (gpsFieldName === "_geolocation") {
      const geo = sub._geolocation;
      if (Array.isArray(geo) && geo.length >= 2) {
        const [lat, lng] = geo as [number, number];
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          points.push({ lat, lng });
        }
      }
      continue;
    }
    const raw = sub[gpsFieldName];
    if (typeof raw === "string" && raw.trim()) {
      const pt = parseGpsString(raw);
      if (pt) points.push(pt);
    }
  }
  return points;
}

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function buildTimeSeries(
  submissions: KoboSubmission[]
): TimeSeriesPoint[] {
  const freq: Record<string, number> = {};

  for (const sub of submissions) {
    const t = sub._submission_time;
    if (!t || typeof t !== "string") continue;
    const week = getISOWeek(new Date(t));
    freq[week] = (freq[week] ?? 0) + 1;
  }

  return Object.entries(freq)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));
}
