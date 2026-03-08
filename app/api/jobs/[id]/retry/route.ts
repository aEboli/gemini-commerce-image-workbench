import { NextResponse } from "next/server";

import { createJob, getJobDetails } from "@/lib/db";
import { buildRetryJobInput } from "@/lib/job-builder";
import { enqueueJob } from "@/lib/queue";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const details = getJobDetails(id);
  if (!details) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const createInput = buildRetryJobInput(details);
  const newJob = createJob(createInput);
  enqueueJob(newJob.id);

  return NextResponse.json({ jobId: newJob.id });
}
