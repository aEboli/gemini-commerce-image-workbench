import { NextResponse } from "next/server";

import { createTemplate, listTemplates } from "@/lib/db";
import type { TemplateFilters, TemplateInput } from "@/lib/types";

export const runtime = "nodejs";

function validateTemplateInput(input: Partial<TemplateInput>) {
  const requiredFields: Array<keyof TemplateInput> = [
    "name",
    "country",
    "language",
    "platform",
    "category",
    "imageType",
    "promptTemplate",
    "copyTemplate",
    "layoutStyle",
  ];

  for (const field of requiredFields) {
    const value = input[field];
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`Field ${field} is required.`);
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters: TemplateFilters = {
    search: searchParams.get("search") || undefined,
    country: searchParams.get("country") || undefined,
    language: searchParams.get("language") || undefined,
    platform: searchParams.get("platform") || undefined,
    category: searchParams.get("category") || undefined,
    imageType: searchParams.get("imageType") || undefined,
    source: (searchParams.get("source") as TemplateFilters["source"]) || undefined,
  };

  return NextResponse.json(listTemplates(filters));
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<TemplateInput>;

  try {
    validateTemplateInput(body);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid template input." }, { status: 400 });
  }

  const created = createTemplate({
    name: body.name!.trim(),
    country: body.country!.trim(),
    language: body.language!.trim(),
    platform: body.platform!.trim(),
    category: body.category!.trim(),
    imageType: body.imageType!.trim(),
    promptTemplate: body.promptTemplate!.trim(),
    copyTemplate: body.copyTemplate!.trim(),
    layoutStyle: body.layoutStyle!.trim(),
    isDefault: false,
  });

  return NextResponse.json(created, { status: 201 });
}
