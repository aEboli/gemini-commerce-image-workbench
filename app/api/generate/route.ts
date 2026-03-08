import { NextResponse } from "next/server";

import { createJob } from "@/lib/db";
import { buildCreateJobInput, type CreatePayload } from "@/lib/job-builder";
import { enqueueJob } from "@/lib/queue";
import { writeFileAsset } from "@/lib/storage";
import { createId } from "@/lib/utils";

export const runtime = "nodejs";

function isPayload(value: unknown): value is CreatePayload & { temporaryApiKey?: string } {
  if (!value || typeof value !== "object") {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const payloadRaw = formData.get("payload");
  const files = formData.getAll("files").filter((file): file is File => file instanceof File);

  if (!payloadRaw || typeof payloadRaw !== "string" || !files.length) {
    return NextResponse.json({ error: "Missing payload or files." }, { status: 400 });
  }

  const payload = JSON.parse(payloadRaw) as unknown;
  if (!isPayload(payload)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!payload.productName || !payload.selectedTypes?.length || !payload.selectedRatios?.length || !payload.selectedResolutions?.length) {
    return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
  }

  const totalVariants = files.length * payload.selectedTypes.length * payload.selectedRatios.length * payload.selectedResolutions.length * payload.variantsPerType;
  if (totalVariants > 96) {
    return NextResponse.json({ error: "This batch is too large. Keep it under 96 generated variants per job." }, { status: 400 });
  }

  const jobId = createId("job");
  const sourceAssets = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return writeFileAsset({
        jobId,
        kind: "source",
        originalName: file.name,
        mimeType: file.type || "image/png",
        buffer,
      });
    }),
  );

  const createInput = buildCreateJobInput(sourceAssets, payload, jobId);
  const job = createJob(createInput);
  enqueueJob(job.id, payload.temporaryApiKey);

  return NextResponse.json({ jobId: job.id });
}
