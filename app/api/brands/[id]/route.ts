import { NextResponse } from "next/server";

import { deleteBrand, getBrandById, getBrandByName, updateBrand } from "@/lib/db";
import type { BrandInput } from "@/lib/types";

function isBrandPatch(value: unknown): value is Partial<BrandInput> {
  if (!value || typeof value !== "object") {
    return false;
  }

  return true;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = getBrandById(id);
  if (!existing) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  if (!isBrandPatch(body)) {
    return NextResponse.json({ error: "Invalid brand input." }, { status: 400 });
  }

  const nextName = typeof (body as Partial<BrandInput>).name === "string" ? (body as Partial<BrandInput>).name!.trim() : existing.name;
  if (!nextName) {
    return NextResponse.json({ error: "Brand name is required." }, { status: 400 });
  }

  const conflict = getBrandByName(nextName);
  if (conflict && conflict.id !== id) {
    return NextResponse.json({ error: "Brand already exists." }, { status: 409 });
  }

  const brand = updateBrand(id, body as Partial<BrandInput>);
  return NextResponse.json(brand);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = getBrandById(id);
  if (!existing) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 });
  }

  deleteBrand(id);
  return new NextResponse(null, { status: 204 });
}
