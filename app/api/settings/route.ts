import { NextResponse } from "next/server";

import { getSettings, updateSettings } from "@/lib/db";
import { testProviderConnection } from "@/lib/gemini";
import type { AppSettings } from "@/lib/types";

export const runtime = "nodejs";

function validateHeadersJson(rawHeaders?: string) {
  if (!rawHeaders?.trim()) {
    return;
  }

  const parsed = JSON.parse(rawHeaders);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Custom headers JSON must be an object.");
  }
}

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<AppSettings>;

  try {
    validateHeadersJson(body.defaultApiHeaders);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid headers JSON." }, { status: 400 });
  }

  return NextResponse.json(updateSettings(body));
}