"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { topSourceSchools, topDestinationSchools, StudentRecord } from "@/lib/kobo/agile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  records: StudentRecord[];
}

function truncate(s: string, max = 28): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export function SourceSchoolsChart({ records }: Props) {
  const raw = topSourceSchools(records, 10);
  const data = raw.map((d) => ({ ...d, shortName: truncate(d.name) }));

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Top 10 source schools (previous)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="shortName"
              tick={{ fontSize: 10 }}
              width={200}
            />
            <Tooltip
              formatter={(v) => [v, "Students"]}
              labelFormatter={(label, payload) =>
                payload?.[0]?.payload?.name ?? label
              }
            />
            <Bar dataKey="count" fill="#16a34a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DestinationSchoolsChart({ records }: Props) {
  const raw = topDestinationSchools(records, 10);
  const data = raw.map((d) => ({ ...d, shortName: truncate(d.name) }));

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Top 10 destination schools (new)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="shortName"
              tick={{ fontSize: 10 }}
              width={200}
            />
            <Tooltip
              formatter={(v) => [v, "Students"]}
              labelFormatter={(label, payload) =>
                payload?.[0]?.payload?.name ?? label
              }
            />
            <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
