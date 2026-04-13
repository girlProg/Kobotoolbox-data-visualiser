"use client";

import { StudentRecord, ninCaptureStats } from "@/lib/kobo/agile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, School, Fingerprint, ClipboardCheck } from "lucide-react";

interface Props {
  records: StudentRecord[];
  loading?: boolean;
}

function Stat({
  icon: Icon,
  title,
  value,
  sub,
  loading,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  sub?: string;
  loading?: boolean;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon size={14} className={color} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <>
            <p className="text-3xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function AgileStatCards({ records, loading }: Props) {
  const nin = ninCaptureStats(records);
  const uniqueSchools = new Set(records.map((r) => r.previousSchool).filter(Boolean)).size;
  const uniqueEnumerators = new Set(records.map((r) => r.enumeratorCode).filter(Boolean)).size;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Stat
        icon={Users}
        title="Students tracked"
        value={records.length.toLocaleString()}
        sub="total form submissions"
        loading={loading}
        color="text-blue-600"
      />
      <Stat
        icon={School}
        title="Previous schools"
        value={uniqueSchools}
        sub="unique source schools"
        loading={loading}
        color="text-green-600"
      />
      <Stat
        icon={Fingerprint}
        title="NIN capture rate"
        value={`${nin.rate}%`}
        sub={`${nin.withNin} of ${nin.total} students`}
        loading={loading}
        color="text-purple-600"
      />
      <Stat
        icon={ClipboardCheck}
        title="Active enumerators"
        value={uniqueEnumerators}
        sub="EMIS officers with submissions"
        loading={loading}
        color="text-orange-600"
      />
    </div>
  );
}
