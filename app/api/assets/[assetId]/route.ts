import fs from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { getAssetById } from "@/lib/db";

export const runtime = "nodejs";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

function inferDownloadName(originalName: string, mimeType: string) {
  const trimmed = originalName.trim() || "asset";
  const currentExtension = path.extname(trimmed);
  const preferredExtension = MIME_EXTENSION_MAP[mimeType] ?? "";

  if (currentExtension && currentExtension !== ".generated") {
    return trimmed;
  }

  const baseName = currentExtension ? path.basename(trimmed, currentExtension) : trimmed;
  return `${baseName}${preferredExtension}`;
}

function toAsciiFilename(filename: string) {
  const extension = path.extname(filename);
  const baseName = path.basename(filename, extension);
  const normalizedBase = baseName
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "asset";
  const safeExtension = /^[.A-Za-z0-9_-]+$/.test(extension) ? extension : "";
  return `${normalizedBase}${safeExtension}`;
}

function makeContentDisposition(filename: string) {
  const asciiFilename = toAsciiFilename(filename);
  const encodedFilename = encodeURIComponent(filename)
    .replace(/['()]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, "%2A");

  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const asset = getAssetById(assetId);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const buffer = await fs.readFile(asset.filePath);
  const filename = inferDownloadName(asset.originalName, asset.mimeType);
  const shouldDownload = request.nextUrl.searchParams.get("download") === "1";

  const headers = new Headers({
    "Content-Type": asset.mimeType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });

  if (shouldDownload) {
    headers.set("Content-Disposition", makeContentDisposition(filename));
  }

  return new NextResponse(buffer, { headers });
}
