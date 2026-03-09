import { NextResponse } from "next/server";

import { listTemplateCandidates, resolveTemplate } from "@/lib/db";

export const runtime = "nodejs";

interface MatchRequestBody {
  country?: string;
  language?: string;
  platform?: string;
  category?: string;
  imageTypes?: string[];
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as MatchRequestBody | null;

  if (!body?.country || !body.language || !body.platform || !body.category || !Array.isArray(body.imageTypes)) {
    return NextResponse.json({ error: "Missing match fields." }, { status: 400 });
  }

  const matches = body.imageTypes.map((imageType) => ({
    imageType,
    template: resolveTemplate({
      country: body.country!,
      language: body.language!,
      platform: body.platform!,
      category: body.category!,
      imageType,
    }),
    candidates: listTemplateCandidates({
      country: body.country!,
      language: body.language!,
      platform: body.platform!,
      category: body.category!,
      imageType,
    }),
  }));

  return NextResponse.json({ matches });
}
