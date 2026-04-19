"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { dailySubmissionsByLga, StudentRecord } from "@/lib/kobo/agile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 22 distinct colours cycling through a palette
const PALETTE = [
  "#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#ea580c", "#4f46e5",
  "#059669", "#b45309", "#be123c", "#0284c7", "#7e22ce",
  "#15803d", "#c2410c", "#1d4ed8", "#a21caf", "#0f766e",
  "#92400e", "#1e40af",
];

interface Props {
  records: StudentRecord[];
  days?: number;
}

export function DailySubmissionsChart({ records, days = 14 }: Props) {
  const { rows, lgas } = dailySubmissionsByLga(records, days);

  if (rows.length === 0) return null;

  // Format "2024-05-03" → "May 3"
  const formatDate = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Daily submissions per LGA
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            last {days} days
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={rows}
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => [value, ""]}
              labelFormatter={(label) => formatDate(String(label))}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconSize={10}
            />
            {lgas.map((lga, i) => (
              <Bar
                key={lga}
                dataKey={lga}
                stackId="a"
                fill={PALETTE[i % PALETTE.length]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
