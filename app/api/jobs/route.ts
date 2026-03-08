import { NextResponse } from "next/server";

import { listJobs, type JobListFilters } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters: JobListFilters = {
    search: searchParams.get("search") || undefined,
    status: searchParams.get("status") || undefined,
    platform: searchParams.get("platform") || undefined,
    country: searchParams.get("country") || undefined,
    language: searchParams.get("language") || undefined,
    imageType: searchParams.get("imageType") || undefined,
    resolution: searchParams.get("resolution") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
  };

  return NextResponse.json(listJobs(filters));
}
