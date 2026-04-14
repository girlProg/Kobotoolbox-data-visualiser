import { NextResponse } from "next/server";
import { koboFetch } from "@/lib/kobo/client";
import { KoboAssetsResponse, KoboAsset, KoboChoice } from "@/lib/kobo/types";

export const dynamic = "force-dynamic";

export interface LgaProgress {
  uid: string;
  name: string;
  done: number;
  total: number; // number of student_id choices = students to track
}

export async function GET() {
  // 1. Fetch all deployed assets
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

  // 2. Fetch each form's content in parallel to count student_id choices
  const results = await Promise.all(
    deployed.map(async (asset): Promise<LgaProgress> => {
      try {
        const formRes = await koboFetch(
          `/api/v2/assets/${asset.uid}/?format=json`
        );
        if (!formRes.ok) throw new Error("form fetch failed");
        const form: KoboAsset = await formRes.json();
        const choices: KoboChoice[] = form.content?.choices ?? [];
        const studentCount = choices.filter(
          (c) => c.list_name === "student_id"
        ).length;
        return {
          uid: asset.uid,
          name: asset.name,
          done: asset.deployment__submission_count ?? 0,
          total: studentCount,
        };
      } catch {
        return {
          uid: asset.uid,
          name: asset.name,
          done: asset.deployment__submission_count ?? 0,
          total: 0,
        };
      }
    })
  );

  return NextResponse.json(results, {
    // Cache for 5 minutes — student lists rarely change; done counts refresh
    // on the next dashboard poll via the assets endpoint
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
