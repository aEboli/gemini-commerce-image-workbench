import { COUNTRIES, IMAGE_TYPE_OPTIONS, OUTPUT_LANGUAGES, PLATFORMS, PRODUCT_CATEGORIES } from "@/lib/constants";
import type { GeneratedCopyBundle, ImageType, TemplateRecord } from "@/lib/types";
import { createId, nowIso } from "@/lib/utils";

const platformStyles: Record<string, { tone: string; palette: string; layout: string }> = {
  amazon: {
    tone: "clean, premium, conversion-focused, compliant",
    palette: "white, blue, soft orange accents",
    layout: "clean comparison blocks and structured highlights",
  },
  "tiktok-shop": {
    tone: "energetic, social-first, trend-aware",
    palette: "high contrast, modern neon accents, dynamic lighting",
    layout: "bold headline, strong focal subject, creator-style motion cues",
  },
  taobao: {
    tone: "high-conversion, bold, fast-moving retail",
    palette: "warm reds, cream, vibrant product emphasis",
    layout: "promotional blocks with strong CTA and price-energy styling",
  },
  tmall: {
    tone: "premium retail, polished, aspirational",
    palette: "deep red, black, gold highlights",
    layout: "hero-led premium retail composition",
  },
  jd: {
    tone: "trustworthy, product-forward, efficient",
    palette: "white, red, silver",
    layout: "clean blocks, practical benefit framing",
  },
  shopee: {
    tone: "friendly, mobile-first, accessible",
    palette: "orange, white, fresh gradients",
    layout: "mobile shopping card style",
  },
  lazada: {
    tone: "bold marketplace retail",
    palette: "purple, pink, orange gradients",
    layout: "bright marketplace card layout",
  },
  ebay: {
    tone: "practical, clear, listing-oriented",
    palette: "white with bold color accents",
    layout: "clear specs and listing-oriented imagery",
  },
  etsy: {
    tone: "handcrafted, warm, lifestyle-rich",
    palette: "earthy neutrals, soft warm light",
    layout: "editorial product storytelling with handmade feel",
  },
  rakuten: {
    tone: "clean Japanese retail with trust and value",
    palette: "red, white, soft neutrals",
    layout: "structured retail composition with tidy text zones",
  },
  aliexpress: {
    tone: "global bargain retail, direct response",
    palette: "red, orange, bright highlights",
    layout: "clear value-first composition",
  },
};

const imageTypeGuides: Record<ImageType, { intent: string; extraPrompt: string; copyFocus: string }> = {
  scene: {
    intent: "Show the product naturally used inside a realistic context.",
    extraPrompt: "Build a believable scene around the product with commercial lighting and a clear hero focus.",
    copyFocus: "Lead with everyday value and contextual benefit.",
  },
  "white-background": {
    intent: "Create a clean marketplace-ready white background image.",
    extraPrompt: "Preserve accurate product edges, shape, proportions, and material finish on a pure or near-pure white background.",
    copyFocus: "Focus on core specs and trust-building clarity.",
  },
  model: {
    intent: "Show the product with a model or in human use.",
    extraPrompt: "Select a model styling aligned with the target market and keep the product identity exact.",
    copyFocus: "Highlight fit, comfort, or real-life usage.",
  },
  poster: {
    intent: "Produce a high-impact promotional poster creative.",
    extraPrompt: "Use dramatic composition, strong hierarchy, polished lighting, and visual hooks suitable for ads.",
    copyFocus: "Emphasize campaign energy and urgency.",
  },
  detail: {
    intent: "Zoom attention into the product’s craftsmanship and feature details.",
    extraPrompt: "Use tight crop logic, macro-friendly framing, and call out premium details visually.",
    copyFocus: "Surface material, structure, and product engineering.",
  },
  "pain-point": {
    intent: "Tell a before-vs-after or problem-vs-solution story.",
    extraPrompt: "Show a pain point clearly, then position the product as the hero solution without clutter.",
    copyFocus: "Anchor on user frustration and the product outcome.",
  },
};

export function getTemplateSeedData(): TemplateRecord[] {
  const now = nowIso();
  return IMAGE_TYPE_OPTIONS.map((option) => ({
    id: createId("tpl"),
    name: `${option.value}-default`,
    country: "*",
    language: "*",
    platform: "*",
    category: "*",
    imageType: option.value,
    promptTemplate: imageTypeGuides[option.value].extraPrompt,
    copyTemplate: imageTypeGuides[option.value].copyFocus,
    layoutStyle: "adaptive",
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  }));
}

export function getPlatformStyle(platform: string) {
  return platformStyles[platform] ?? {
    tone: "balanced, conversion-focused, clean",
    palette: "neutral brand-safe palette",
    layout: "clear retail-focused composition",
  };
}

export function getImageTypeGuide(imageType: ImageType) {
  return imageTypeGuides[imageType];
}

export function buildCopyPrompt(input: {
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
}): string {
  const countryLabel = COUNTRIES.find((item) => item.value === input.country)?.label.en ?? input.country;
  const languageLabel = OUTPUT_LANGUAGES.find((item) => item.value === input.language)?.label.en ?? input.language;
  const platformLabel = PLATFORMS.find((item) => item.value === input.platform)?.label.en ?? input.platform;
  const categoryLabel = PRODUCT_CATEGORIES.find((item) => item.value === input.category)?.label.en ?? input.category;
  const imageGuide = getImageTypeGuide(input.imageType);
  const platformGuide = getPlatformStyle(input.platform);

  return [
    `You are an expert e-commerce creative strategist for ${platformLabel}.`,
    `Target market: ${countryLabel}. Output language: ${languageLabel}. Category: ${categoryLabel}.`,
    `Product name: ${input.productName}. Brand: ${input.brandName || "Not specified"}.`,
    `Selling points: ${input.sellingPoints || "Not provided"}.`,
    `Restrictions: ${input.restrictions || "Avoid hallucinating logos, text, and unsupported claims."}.`,
    `Creative goal: ${imageGuide.intent}`,
    `Platform tone: ${platformGuide.tone}. Platform palette: ${platformGuide.palette}.`,
    `Composition ratio: ${input.ratio}. Target resolution bucket: ${input.resolutionLabel}.`,
    `Copy focus: ${imageGuide.copyFocus}`,
    "Return concise, conversion-focused copy that is platform-appropriate and avoids prohibited claims.",
  ].join("\n");
}

export function buildImagePrompt(input: {
  country: string;
  language: string;
  platform: string;
  category: string;
  productName: string;
  brandName: string;
  sellingPoints: string;
  restrictions: string;
  imageType: ImageType;
  ratio: string;
  resolutionLabel: string;
  copy: GeneratedCopyBundle;
}): string {
  const imageGuide = getImageTypeGuide(input.imageType);
  const platformGuide = getPlatformStyle(input.platform);

  return [
    `Edit the provided product image for a ${input.platform} listing in ${input.language} for market ${input.country}.`,
    `Keep the product identity, silhouette, materials, and recognizable shape consistent with the source image.`,
    `Image type: ${input.imageType}. ${imageGuide.extraPrompt}`,
    `Target aspect ratio: ${input.ratio}. Aim for ${input.resolutionLabel} level fidelity.`,
    `Visual tone: ${platformGuide.tone}. Palette: ${platformGuide.palette}. Layout feel: ${platformGuide.layout}.`,
    `Core product highlights: ${input.sellingPoints || input.copy.highlights.join(", ")}.`,
    `Poster headline guidance: ${input.copy.posterHeadline}. Supporting subline: ${input.copy.posterSubline}.`,
    `Do not invent extra products, avoid distorted hands, avoid broken packaging, avoid unreadable text, avoid brand misuse.`,
    `Restrictions: ${input.restrictions || "No unsupported logos, pricing, or medical claims."}.`,
    `Optimized creative direction: ${input.copy.optimizedPrompt}`,
  ].join("\n");
}

export function getCountryLabel(code: string): string {
  return COUNTRIES.find((item) => item.value === code)?.label.en ?? code;
}

export function getLanguageLabel(code: string): string {
  return OUTPUT_LANGUAGES.find((item) => item.value === code)?.label.en ?? code;
}

export function getPlatformLabel(code: string): string {
  return PLATFORMS.find((item) => item.value === code)?.label.en ?? code;
}
