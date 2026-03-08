import { NextResponse } from "next/server";

import { testProviderConnection } from "@/lib/gemini";
import type { AppSettings } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AppSettings>;

  if (!body.defaultApiKey || !body.defaultTextModel) {
    return NextResponse.json({ error: "API key and text model are required." }, { status: 400 });
  }

  try {
    const result = await testProviderConnection({
      apiKey: body.defaultApiKey,
      textModel: body.defaultTextModel,
      apiBaseUrl: body.defaultApiBaseUrl,
      apiVersion: body.defaultApiVersion,
      apiHeaders: body.defaultApiHeaders,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Connection test failed." },
      { status: 400 },
    );
  }
}