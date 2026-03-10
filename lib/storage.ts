import fs from "node:fs/promises";
import path from "node:path";

import { getSettings } from "@/lib/db";
import type { AssetRecord } from "@/lib/types";
import { createId, detectImageDimensions, mimeToExtension, nowIso, sha256 } from "@/lib/utils";

export async function ensureStorageDir() {
  const settings = getSettings();
  await fs.mkdir(settings.storageDir, { recursive: true });
  return settings.storageDir;
}

export async function writeFileAsset(input: {
  jobId: string;
  jobItemId?: string | null;
  kind: AssetRecord["kind"];
  originalName: string;
  mimeType: string;
  buffer: Buffer;
  width?: number | null;
  height?: number | null;
}): Promise<AssetRecord> {
  const storageDir = await ensureStorageDir();
  const extension = mimeToExtension(input.mimeType);
  const assetId = createId("asset");
  const dayFolder = nowIso().slice(0, 10);
  const dir = path.join(storageDir, dayFolder);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${assetId}.${extension}`);
  await fs.writeFile(filePath, input.buffer);
  const detectedDimensions =
    input.mimeType === "image/svg+xml" ? null : detectImageDimensions(input.buffer, input.mimeType);

  return {
    id: assetId,
    jobId: input.jobId,
    jobItemId: input.jobItemId ?? null,
    kind: input.kind,
    originalName: input.originalName,
    mimeType: input.mimeType,
    filePath,
    width: detectedDimensions?.width ?? input.width ?? null,
    height: detectedDimensions?.height ?? input.height ?? null,
    sizeBytes: input.buffer.byteLength,
    sha256: sha256(input.buffer),
    createdAt: nowIso(),
  };
}

export async function readAssetBuffer(asset: AssetRecord): Promise<Buffer> {
  return fs.readFile(asset.filePath);
}
