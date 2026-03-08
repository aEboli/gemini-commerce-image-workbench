import { GoogleGenAI } from "@google/genai";

import { buildCopyPrompt, buildImagePrompt } from "@/lib/templates";
import type { GeneratedCopyBundle, ImageType } from "@/lib/types";

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
  imageType: ImageType;
  ratio: string;
  resolutionLabel: string;
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
  imageType: ImageType;
  ratio: string;
  resolutionLabel: string;
  copy: GeneratedCopyBundle;
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

  if (!imagePart || !("inlineData" in imagePart) || !imagePart.inlineData) {
    throw new Error(textPart && "text" in textPart ? textPart.text || "Gemini did not return an image." : "Gemini did not return an image.");
  }

  return {
    mimeType: imagePart.inlineData.mimeType || "image/png",
    buffer: Buffer.from(imagePart.inlineData.data || "", "base64"),
    notes: textPart && "text" in textPart ? textPart.text ?? "" : "",
  };
}