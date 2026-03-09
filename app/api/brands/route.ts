import { NextResponse } from "next/server";

import { createBrand, getBrandByName, listBrands } from "@/lib/db";
import type { BrandInput } from "@/lib/types";

function isBrandInput(value: unknown): value is BrandInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Record<string, unknown>;
  return ["name", "primaryColor", "tone", "bannedTerms", "promptGuidance"].every((key) => typeof input[key] === "string");
}

export async function GET() {
  return NextResponse.json({ brands: listBrands() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  if (!isBrandInput(body) || !body.name.trim()) {
    return NextResponse.json({ error: "Invalid brand input." }, { status: 400 });
  }

  if (getBrandByName(body.name)) {
    return NextResponse.json({ error: "Brand already exists." }, { status: 409 });
  }

  const brand = createBrand(body);
  return NextResponse.json(brand, { status: 201 });
}
