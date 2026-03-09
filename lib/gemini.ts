import { GoogleGenAI } from "@google/genai";

import { buildCopyPrompt, buildImagePrompt } from "@/lib/templates";
import type { BrandRecord, GeneratedCopyBundle, ImageType, LocalizedCreativeInputs, TemplateRecord } from "@/lib/types";

const translationSchema = {
  type: "object",
  properties: {
    productName: { type: "string" },
    sellingPoints: { type: "string" },
    restrictions: { type: "string" },
    sourceDescription: { type: "string" },
  },
} as const;

const copySchema = {
  type: "object",
  required: [
    "optimizedPrompt",
    "title",
    "subtitle",
    "highlights",
    "detailAngles",
    "painPoints",
    "cta",
    "posterHeadline",
    "posterSubline",
  ],
  properties: {
    optimizedPrompt: { type: "string" },
    title: { type: "string" },
    subtitle: { type: "string" },
    highlights: { type: "array", items: { type: "string" } },
    detailAngles: { type: "array", items: { type: "string" } },
    painPoints: { type: "array", items: { type: "string" } },
    cta: { type: "string" },
    posterHeadline: { type: "string" },
    posterSubline: { type: "string" },
  },
} as const;

interface ProviderConfig {
  apiKey: string;
  apiBaseUrl?: string;
  apiVersion?: string;
  apiHeaders?: string;
}

function mimeTypeFromUrl(url: string) {
  const normalized = url.toLowerCase();
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }
  if (normalized.endsWith(".gif")) {
    return "image/gif";
  }
  return "image/png";
}

function extractImageUrlFromText(text: string) {
  const markdownMatch = text.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/i);
  if (markdownMatch?.[1]) {
    return markdownMatch[1];
  }

  const directMatch = text.match(/https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s]*)?/i);
  return directMatch?.[0] ?? null;
}

function parseHeadersJson(rawHeaders?: string): Record<string, string> | undefined {
  if (!rawHeaders?.trim()) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawHeaders);
  } catch {
    throw new Error("Custom headers JSON is invalid. Please use a valid JSON object.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Custom headers JSON must be an object, for example {\"Authorization\":\"Bearer xxx\"}.");
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string") {
      throw new Error(`Custom header ${key} must be a string value.`);
    }
    headers[key] = value;
  }

  return headers;
}

function createClient(config: ProviderConfig) {
  const baseUrl = config.apiBaseUrl?.trim();
  const apiVersion = config.apiVersion?.trim();
  const headers = parseHeadersJson(config.apiHeaders);

  return new GoogleGenAI({
    apiKey: config.apiKey,
    apiVersion: apiVersion || undefined,
    httpOptions: {
      baseUrl: baseUrl || undefined,
      headers,
    },
  });
}

export function normalizeProviderError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string; status?: string } };
    if (parsed.error?.message) {
      return parsed.error.status ? `${parsed.error.message} (${parsed.error.status})` : parsed.error.message;
    }
  } catch {
    // ignore JSON parse failure
  }

  return raw;
}

export async function testProviderConnection(input: {
  apiKey: string;
  textModel: string;
  apiBaseUrl?: string;
  apiVersion?: string;
  apiHeaders?: string;
}) {
  const ai = createClient(input);
  const response = await ai.models.generateContent({
    model: input.textModel,
    contents: "Reply with OK only.",
  });

  return response.text ?? "OK";
}

export async function translateCreativeInputs(input: {
  apiKey: string;
  textModel: string;
  apiBaseUrl?: string;
  apiVersion?: string;
  apiHeaders?: string;
  country: string;
  language: string;
  platform: string;
  category: string;
  brandName: string;
  sku: string;
  productName: string;
  sellingPoints: string;
  restrictions: string;
  sourceDescription: string;
}): Promise<LocalizedCreativeInputs | null> {
  const hasProductName = Boolean(input.productName.trim());
  const hasSellingPoints = Boolean(input.sellingPoints.trim());
  const hasRestrictions = Boolean(input.restrictions.trim());
  const hasSourceDescription = Boolean(input.sourceDescription.trim());

  if (!hasProductName && !hasSellingPoints && !hasRestrictions && !hasSourceDescription) {
    return null;
  }

  const lines = [
    "You are a localization specialist for e-commerce creative production.",
    `Translate the following user-provided product fields into the target output language ${input.language} for market ${input.country}.`,
    `Target platform: ${input.platform}. Product category: ${input.category}.`,
    "Rules:",
    "- Keep brand names, SKU, model numbers, measurements, units, and proper nouns unchanged unless a natural localized format is clearly better.",
    "- Preserve meaning faithfully and keep the result concise, natural, and suitable for prompt generation and marketing copy.",
    "- If a field is already appropriate for the target language, keep it with only light normalization.",
    "- Do not add any new claims or unsupported details.",
    "- Only return keys for fields that were actually provided with non-empty content.",
    `Brand name reference: ${input.brandName || "Not provided"}.`,
    `SKU reference: ${input.sku || "Not provided"}.`,
  ];

  if (hasProductName) {
    lines.push(`Product name: ${input.productName}`);
  }
  if (hasSellingPoints) {
    lines.push(`Selling points: ${input.sellingPoints}`);
  }
  if (hasRestrictions) {
    lines.push(`Restrictions: ${input.restrictions}`);
  }
  if (hasSourceDescription) {
    lines.push(`Additional notes: ${input.sourceDescription}`);
  }

  lines.push("Return JSON only.");

  const ai = createClient(input);
  const response = await ai.models.generateContent({
    model: input.textModel,
    contents: lines.join("\n"),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: translationSchema,
      temperature: 0.2,
    },
  });

  const parsed = JSON.parse(response.text ?? "{}") as {
    productName?: string;
    sellingPoints?: string;
    restrictions?: string;
    sourceDescription?: string;
  };

  return {
    productName: hasProductName ? parsed.productName?.trim() || input.productName : "",
    sellingPoints: hasSellingPoints ? parsed.sellingPoints?.trim() || input.sellingPoints : "",
    restrictions: hasRestrictions ? parsed.restrictions?.trim() || input.restrictions : "",
    sourceDescription: hasSourceDescription ? parsed.sourceDescription?.trim() || input.sourceDescription : "",
  };
}

export async function generateCopyBundle(input: {
  apiKey: string;
  textModel: string;
  apiBaseUrl?: string;
  apiVersion?: string;
  apiHeaders?: string;
  country: string;
  language: string;
  platform: string;
  category: string;
  brandName: string;
  productName: string;
  sellingPoints: string;
  restrictions: string;
  sourceDescription: string;
  brandProfile?: BrandRecord | null;
  imageType: ImageType;
  ratio: string;
  resolutionLabel: string;
  template?: TemplateRecord | null;
}): Promise<GeneratedCopyBundle> {
  const ai = createClient(input);
  const response = await ai.models.generateContent({
    model: input.textModel,
    contents: buildCopyPrompt(input),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: copySchema,
      temperature: 0.5,
    },
  });

  const parsed = JSON.parse(response.text ?? "{}") as GeneratedCopyBundle;
  return {
    optimizedPrompt: parsed.optimizedPrompt,
    title: parsed.title,
    subtitle: parsed.subtitle,
    highlights: parsed.highlights ?? [],
    detailAngles: parsed.detailAngles ?? [],
    painPoints: parsed.painPoints ?? [],
    cta: parsed.cta,
    posterHeadline: parsed.posterHeadline,
    posterSubline: parsed.posterSubline,
  };
}

export async function generateEditedImage(input: {
  apiKey: string;
  imageModel: string;
  apiBaseUrl?: string;
  apiVersion?: string;
  apiHeaders?: string;
  country: string;
  language: string;
  platform: string;
  category: string;
  brandName: string;
  productName: string;
  sellingPoints: string;
  restrictions: string;
  sourceDescription: string;
  brandProfile?: BrandRecord | null;
  imageType: ImageType;
  ratio: string;
  resolutionLabel: string;
  copy: GeneratedCopyBundle;
  template?: TemplateRecord | null;
  sourceImages: Array<{ mimeType: string; buffer: Buffer }>;
}) {
  const ai = createClient(input);
  const imageConfig: Record<string, string> = {
    aspectRatio: input.ratio,
  };

  if (input.imageModel.startsWith("gemini-3")) {
    imageConfig.imageSize = input.resolutionLabel;
  }

  const response = await ai.models.generateContent({
    model: input.imageModel,
    contents: [
      ...input.sourceImages.map((image) => ({
        inlineData: {
          mimeType: image.mimeType,
          data: image.buffer.toString("base64"),
        },
      })),
      { text: buildImagePrompt(input) },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig,
      temperature: 0.7,
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => "inlineData" in part && part.inlineData?.data);
  const textPart = parts.find((part) => "text" in part && part.text);
  const textContent = textPart && "text" in textPart ? textPart.text ?? "" : "";

  if (!imagePart || !("inlineData" in imagePart) || !imagePart.inlineData) {
    const imageUrl = extractImageUrlFromText(textContent);

    if (imageUrl) {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(textContent || `Gemini returned an image URL, but the file download failed: ${imageResponse.status}`);
      }

      const mimeType = imageResponse.headers.get("content-type") || mimeTypeFromUrl(imageUrl);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());

      return {
        mimeType,
        buffer,
        notes: textContent,
      };
    }

    throw new Error(textContent || "Gemini did not return an image.");
  }

  return {
    mimeType: imagePart.inlineData.mimeType || "image/png",
    buffer: Buffer.from(imagePart.inlineData.data || "", "base64"),
    notes: textContent,
  };
}
