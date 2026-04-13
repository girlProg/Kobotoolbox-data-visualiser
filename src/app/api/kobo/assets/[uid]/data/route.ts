import { NextResponse } from "next/server";
import { koboFetch } from "@/lib/kobo/client";
import { KoboDataResponse, KoboSubmission } from "@/lib/kobo/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

export async function GET(
  _req: Request,
  { params }: { params: { uid: string } }
) {
  const allResults: KoboSubmission[] = [];
  let nextPath: string | null =
    `/api/v2/assets/${params.uid}/data/?format=json&page_size=${PAGE_SIZE}`;
  let totalCount = 0;

  while (nextPath) {
    const res = await koboFetch(nextPath);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: res.status }
      );
    }

    const page: KoboDataResponse = await res.json();
    totalCount = page.count;
    allResults.push(...page.results);

    // page.next is an absolute URL like https://kf.kobotoolbox.org/api/v2/...?start=100&...
    // Extract just the path+query so koboFetch can prepend the base URL
    if (page.next) {
      try {
        const url = new URL(page.next);
        nextPath = url.pathname + url.search;
      } catch {
        nextPath = null;
      }
    } else {
      nextPath = null;
    }
  }

  const response: KoboDataResponse = {
    count: totalCount,
    next: null,
    results: allResults,
  };

  return NextResponse.json(response, {
    headers: { "Cache-Control": "no-store" },
  });
}
