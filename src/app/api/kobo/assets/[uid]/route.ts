import { NextResponse } from "next/server";
import { koboFetch } from "@/lib/kobo/client";

export const dynamic = "force-dynamic";
import { KoboAsset } from "@/lib/kobo/types";

export async function GET(
  _req: Request,
  { params }: { params: { uid: string } }
) {
  const res = await koboFetch(
    `/api/v2/assets/${params.uid}/?format=json`
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch form definition" },
      { status: res.status }
    );
  }

  const data: KoboAsset = await res.json();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
