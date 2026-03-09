import { NextResponse } from "next/server";

import { getJobItemById, updateJobItemReviewStatus } from "@/lib/db";
import type { JobItemReviewStatus } from "@/lib/types";

const REVIEW_STATUSES: JobItemReviewStatus[] = ["unreviewed", "shortlisted", "approved", "rejected"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = getJobItemById(id);
  if (!existing) {
    return NextResponse.json({ error: "Job item not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { reviewStatus?: string } | null;
  if (!body?.reviewStatus || !REVIEW_STATUSES.includes(body.reviewStatus as JobItemReviewStatus)) {
    return NextResponse.json({ error: "Invalid review status." }, { status: 400 });
  }

  const item = updateJobItemReviewStatus(id, body.reviewStatus as JobItemReviewStatus);
  return NextResponse.json(item);
}
