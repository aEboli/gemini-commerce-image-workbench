import { createHash, randomUUID } from "node:crypto";

export function toJson<T>(value: T): string {
  return JSON.stringify(value);
}

export function fromJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function parseRatio(value: string): [number, number] {
  const [left, right] = value.split(":").map(Number);
  return [left || 1, right || 1];
}

export function resolutionToPixels(label: string): number {
  switch (label) {
    case "512px":
      return 512;
    case "1K":
      return 1024;
    case "2K":
      return 2048;
    case "4K":
      return 4096;
    default:
      return 1024;
  }
}

export function dimensionsForVariant(ratio: string, resolution: string): { width: number; height: number } {
  const [w, h] = parseRatio(ratio);
  const maxSize = resolutionToPixels(resolution);
  const maxBase = Math.max(w, h);
  const scale = maxSize / maxBase;
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
  };
}

export function mimeToExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    case "image/svg+xml":
      return "svg";
    default:
      return "bin";
  }
}
