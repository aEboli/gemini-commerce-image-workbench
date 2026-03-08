import { getPlatformStyle } from "@/lib/templates";
import type { GeneratedCopyBundle, ImageType } from "@/lib/types";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createBullets(items: string[], x: number, y: number, lineHeight: number, fontSize: number) {
  return items
    .slice(0, 3)
    .map(
      (item, index) => `
        <text x="${x}" y="${y + index * lineHeight}" fill="#ffffff" font-size="${fontSize}" font-family="Arial, sans-serif">• ${escapeXml(item)}</text>`
    )
    .join("");
}

export function createPosterSvg(input: {
  imageBuffer: Buffer;
  imageMimeType: string;
  width: number;
  height: number;
  copy: GeneratedCopyBundle;
  platform: string;
  imageType: ImageType;
  productName: string;
}) {
  const imageBase64 = input.imageBuffer.toString("base64");
  const heroHeight = Math.round(input.height * 0.68);
  const copyTop = heroHeight + 48;
  const platformStyle = getPlatformStyle(input.platform);
  const accent = input.platform === "amazon" ? "#1d4ed8" : input.platform === "tiktok-shop" ? "#ec4899" : input.platform === "taobao" ? "#f97316" : "#8b5cf6";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}" viewBox="0 0 ${input.width} ${input.height}">
      <defs>
        <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="100%" stop-color="#1f2937" />
        </linearGradient>
        <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.55)" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="#0f172a" rx="32" />
      <image href="data:${input.imageMimeType};base64,${imageBase64}" x="0" y="0" width="${input.width}" height="${heroHeight}" preserveAspectRatio="xMidYMid slice" />
      <rect x="0" y="0" width="${input.width}" height="${heroHeight}" fill="url(#overlay)" />
      <rect x="0" y="${heroHeight - 12}" width="${input.width}" height="${input.height - heroHeight + 12}" fill="url(#panel)" rx="32" />
      <rect x="48" y="48" width="220" height="44" rx="22" fill="rgba(15,23,42,0.78)" stroke="${accent}" stroke-width="2" />
      <text x="158" y="77" text-anchor="middle" fill="#ffffff" font-size="20" font-weight="700" font-family="Arial, sans-serif">${escapeXml(input.imageType.toUpperCase())}</text>
      <rect x="48" y="${copyTop - 8}" width="120" height="6" rx="3" fill="${accent}" />
      <text x="48" y="${copyTop + 32}" fill="#ffffff" font-size="44" font-weight="800" font-family="Arial, sans-serif">${escapeXml(input.copy.posterHeadline)}</text>
      <text x="48" y="${copyTop + 78}" fill="#cbd5e1" font-size="24" font-family="Arial, sans-serif">${escapeXml(input.copy.posterSubline)}</text>
      <text x="48" y="${copyTop + 128}" fill="#93c5fd" font-size="22" font-family="Arial, sans-serif">${escapeXml(input.productName)}</text>
      ${createBullets(input.copy.highlights, 48, copyTop + 180, 38, 24)}
      <rect x="48" y="${input.height - 120}" width="240" height="56" rx="28" fill="${accent}" />
      <text x="168" y="${input.height - 84}" text-anchor="middle" fill="#ffffff" font-size="24" font-weight="700" font-family="Arial, sans-serif">${escapeXml(input.copy.cta)}</text>
      <text x="${input.width - 48}" y="${input.height - 54}" text-anchor="end" fill="#94a3b8" font-size="18" font-family="Arial, sans-serif">${escapeXml(platformStyle.layout)}</text>
    </svg>
  `.trim();
}
