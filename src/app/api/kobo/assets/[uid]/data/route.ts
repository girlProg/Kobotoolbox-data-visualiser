import { NextResponse } from "next/server";
import { koboFetch } from "@/lib/kobo/client";

export const dynamic = "force-dynamic";
import { KoboDataResponse } from "@/lib/kobo/types";

export async function GET(
  _req: Request,
  { params }: { params: { uid: string } }
) {
  const res = await koboFetch(
    `/api/v2/assets/${params.uid}/data/?format=json&page_size=5000`
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: res.status }
    );
  }

  const data: KoboDataResponse = await res.json();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
