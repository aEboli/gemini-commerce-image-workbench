import { NextResponse } from "next/server";

import { deleteTemplate, getTemplateById, updateTemplate } from "@/lib/db";
import type { TemplateInput } from "@/lib/types";

export const runtime = "nodejs";

function normalizeTemplatePatch(input: Partial<TemplateInput>) {
  const patch: Partial<TemplateInput> = {};
  const stringFields: Array<keyof TemplateInput> = [
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

  for (const field of stringFields) {
    const value = input[field];
    if (value !== undefined) {
      if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Field ${field} must be a non-empty string.`);
      }
      patch[field] = value.trim() as never;
    }
  }

  return patch;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const template = getTemplateById(id);
  if (!template) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const existing = getTemplateById(id);
  if (!existing) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }
  if (existing.isDefault) {
    return NextResponse.json({ error: "Default templates are read-only. Duplicate them first." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Partial<TemplateInput>;
    const updated = updateTemplate(id, normalizeTemplatePatch(body));
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid template input." }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const existing = getTemplateById(id);
  if (!existing) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }
  if (existing.isDefault) {
    return NextResponse.json({ error: "Default templates cannot be deleted." }, { status: 400 });
  }

  const deleted = deleteTemplate(id);
  return NextResponse.json({ deleted });
}
