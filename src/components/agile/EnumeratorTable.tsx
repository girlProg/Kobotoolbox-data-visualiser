"use client";

import { groupByEnumerator, StudentRecord } from "@/lib/kobo/agile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  records: StudentRecord[];
}

export function EnumeratorTable({ records }: Props) {
  const stats = groupByEnumerator(records);

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Enumerator submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No enumerator data yet.</p>
        </CardContent>
      </Card>
    );
  }

  const max = stats[0]?.count ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          EMIS Officer submissions ({stats.length} active)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Officer</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">LGA</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Submissions</th>
                <th className="px-4 py-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.code} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2 font-medium">{s.label}</td>
                  <td className="px-4 py-2">
                    {s.lga ? (
                      <Badge variant="secondary" className="text-xs">{s.lga}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">{s.count}</td>
                  <td className="px-4 py-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(s.count / max) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
