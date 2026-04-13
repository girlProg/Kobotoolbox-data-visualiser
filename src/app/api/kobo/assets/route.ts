import { NextResponse } from "next/server";
import { koboFetch } from "@/lib/kobo/client";

export const dynamic = "force-dynamic";
import { KoboAssetsResponse } from "@/lib/kobo/types";

export async function GET() {
  const res = await koboFetch(
    "/api/v2/assets/?asset_type=survey&format=json&page_size=200"
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch projects from KoboToolbox" },
      { status: res.status }
    );
  }

  const data: KoboAssetsResponse = await res.json();

  // Only surface projects that are actively deployed (exclude drafts and archived)
  const deployed = data.results.filter(
    (a) => a.deployment_status === "deployed"
  );

  return NextResponse.json(deployed, {
    headers: { "Cache-Control": "no-store" },
  });
}
