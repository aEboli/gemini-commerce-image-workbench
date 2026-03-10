import { COUNTRIES, IMAGE_TYPE_OPTIONS, OUTPUT_LANGUAGES, PLATFORMS, PRODUCT_CATEGORIES } from "@/lib/constants";
import type {
  BrandRecord,
  GeneratedCopyBundle,
  ImageType,
  ReferenceLayoutAnalysis,
  ReferencePosterCopy,
  TemplateRecord,
} from "@/lib/types";
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

function buildTemplateOverrideLines(template?: TemplateRecord | null) {
  if (!template) {
    return [];
  }

  return [
    `Template name: ${template.name}.`,
    `Template scope: country=${template.country}, language=${template.language}, platform=${template.platform}, category=${template.category}, imageType=${template.imageType}.`,
    `Template prompt strategy: ${template.promptTemplate}`,
    `Template copy strategy: ${template.copyTemplate}`,
    `Template layout style: ${template.layoutStyle}`,
  ];
}

function buildBrandOverrideLines(brandProfile?: BrandRecord | null) {
  if (!brandProfile) {
    return [];
  }

  return [
    `Brand profile: ${brandProfile.name}.`,
    `Brand primary color: ${brandProfile.primaryColor || "Not specified"}.`,
    `Brand tone: ${brandProfile.tone || "Not specified"}.`,
    `Brand banned terms: ${brandProfile.bannedTerms || "None specified"}.`,
    `Brand guidance: ${brandProfile.promptGuidance || "Keep brand expression consistent and clean."}`,
  ];
}

export function buildCopyPrompt(input: {
  country: string;
  language: string;
  platform: string;
  category: string;
  brandName: string;
  brandProfile?: BrandRecord | null;
  productName: string;
  sellingPoints: string;
  restrictions: string;
  sourceDescription: string;
  imageType: ImageType;
  ratio: string;
  resolutionLabel: string;
  template?: TemplateRecord | null;
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
    ...buildBrandOverrideLines(input.brandProfile),
    `Selling points: ${input.sellingPoints || "Not provided"}.`,
    `Additional notes: ${input.sourceDescription || "Not provided"}.`,
    `Restrictions: ${input.restrictions || "Avoid hallucinating logos, text, and unsupported claims."}.`,
    `Creative goal: ${imageGuide.intent}`,
    `Platform tone: ${platformGuide.tone}. Platform palette: ${platformGuide.palette}.`,
    `Composition ratio: ${input.ratio}. Target resolution bucket: ${input.resolutionLabel}.`,
    `Copy focus: ${imageGuide.copyFocus}`,
    ...buildTemplateOverrideLines(input.template),
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
  brandProfile?: BrandRecord | null;
  sellingPoints: string;
  restrictions: string;
  sourceDescription: string;
  imageType: ImageType;
  ratio: string;
  resolutionLabel: string;
  copy: GeneratedCopyBundle;
  template?: TemplateRecord | null;
}): string {
  const imageGuide = getImageTypeGuide(input.imageType);
  const platformGuide = getPlatformStyle(input.platform);

  return [
    `Edit the provided product image for a ${input.platform} listing in ${input.language} for market ${input.country}.`,
    "Keep the product identity, silhouette, materials, and recognizable shape consistent with the source image.",
    ...buildBrandOverrideLines(input.brandProfile),
    `Image type: ${input.imageType}. ${imageGuide.extraPrompt}`,
    `Target aspect ratio: ${input.ratio}. Aim for ${input.resolutionLabel} level fidelity.`,
    `Visual tone: ${platformGuide.tone}. Palette: ${platformGuide.palette}. Layout feel: ${platformGuide.layout}.`,
    `Core product highlights: ${input.sellingPoints || input.copy.highlights.join(", ")}.`,
    `Additional product notes: ${input.sourceDescription || "Not provided."}.`,
    `Poster headline guidance: ${input.copy.posterHeadline}. Supporting subline: ${input.copy.posterSubline}.`,
    `Do not invent extra products, avoid distorted hands, avoid broken packaging, avoid unreadable text, avoid brand misuse.`,
    `Restrictions: ${input.restrictions || "No unsupported logos, pricing, or medical claims."}.`,
    ...buildTemplateOverrideLines(input.template),
    `Optimized creative direction: ${input.copy.optimizedPrompt}`,
  ].join("\n");
}

export function buildPromptModePrompt(input: {
  country: string;
  language: string;
  platform: string;
  category: string;
  productName: string;
  brandName: string;
  brandProfile?: BrandRecord | null;
  sellingPoints: string;
  restrictions: string;
  sourceDescription: string;
  imageType: ImageType;
  ratio: string;
  resolutionLabel: string;
  customPrompt: string;
  customNegativePrompt?: string;
}) {
  const imageGuide = getImageTypeGuide(input.imageType);
  const platformGuide = getPlatformStyle(input.platform);

  return [
    `Edit the provided product image for a ${input.platform} listing in ${input.language} for market ${input.country}.`,
    "Keep the product identity, silhouette, materials, label placement, and recognizable shape consistent with the source image.",
    ...buildBrandOverrideLines(input.brandProfile),
    `Preferred image type: ${input.imageType}. ${imageGuide.extraPrompt}`,
    `Target aspect ratio: ${input.ratio}. Aim for ${input.resolutionLabel} level fidelity.`,
    `Visual tone: ${platformGuide.tone}. Palette: ${platformGuide.palette}. Layout feel: ${platformGuide.layout}.`,
    `Product name: ${input.productName}. Brand: ${input.brandName || "Not specified"}. Category: ${input.category}.`,
    `Selling points: ${input.sellingPoints || "Not provided"}.`,
    `Additional notes: ${input.sourceDescription || "Not provided"}.`,
    `Restrictions: ${input.restrictions || "No unsupported logos, pricing, or medical claims."}.`,
    `User creative prompt: ${input.customPrompt}`,
    input.customNegativePrompt?.trim()
      ? `Avoid these outcomes: ${input.customNegativePrompt.trim()}`
      : null,
    "Follow the user creative prompt closely while keeping the uploaded product visually accurate and commercially clean.",
  ]
    .filter(Boolean)
    .join("\n");
}

function strengthPrompt(referenceStrength: "reference" | "balanced" | "product") {
  if (referenceStrength === "reference") {
    return [
      "Prioritize a high-fidelity remake of the reference poster.",
      "Stay very close to the reference composition, text block positions, packaging relationship, background scene type, and decorative elements.",
    ];
  }

  if (referenceStrength === "product") {
    return [
      "Use the reference poster as a strong structural guide, but let the uploaded product remain the visual priority.",
      "If needed, relax some background or decoration details so the final poster feels more natural around the uploaded product.",
    ];
  }

  return [
    "Balance both goals: preserve the reference poster structure while adapting details so the uploaded product integrates naturally.",
  ];
}

function nonEmptyList(values: string[]) {
  return values.filter((value) => value.trim().length > 0);
}

export function buildReferenceRemakePrompt(input: {
  country: string;
  language: string;
  platform: string;
  category: string;
  productName: string;
  brandName: string;
  brandProfile?: BrandRecord | null;
  sellingPoints: string;
  restrictions: string;
  sourceDescription: string;
  ratio: string;
  resolutionLabel: string;
  referenceStrength: "reference" | "balanced" | "product";
  referenceLayout: ReferenceLayoutAnalysis;
  remakeCopy: ReferencePosterCopy;
  promptVariant?: "strict" | "fallback";
}) {
  const isFallback = input.promptVariant === "fallback";
  const strengthLines = strengthPrompt(input.referenceStrength);
  const callouts = nonEmptyList(input.remakeCopy.callouts);
  const props = nonEmptyList(input.referenceLayout.supportingProps);
  const palette = nonEmptyList(input.referenceLayout.palette);

  return [
    `Create a remade e-commerce poster in ${input.language} for market ${input.country}.`,
    "Input order is fixed: the first uploaded image is the true product source image; the second uploaded image is the poster reference layout image.",
    "Use the first image only for product identity and visual truth: bottle shape, cap shape, label placement, material, transparency, reflections, and proportions.",
    "Use the second image as the poster blueprint: rebuild its composition, text zones, background type, packaging relationship, decorative props, and overall commercial poster feeling.",
    "This is a poster remake task, not a generic lifestyle scene generation task.",
    "Replace the original reference product completely with the uploaded product while keeping the poster structure as close as possible to the reference.",
    "Preserve the reference poster's top banner, main title area, subtitle area, bottom banner, and the relative placement between the main product and any packaging or secondary merchandise.",
    "Allow rebuilding extra supporting elements that appear in the reference poster, including packaging boxes, cups, icon badges, mountain scenery, surfaces, and decorative accents, as long as the uploaded product remains the hero.",
    ...strengthLines,
    ...buildBrandOverrideLines(input.brandProfile),
    `Reference poster summary: ${input.referenceLayout.summary}.`,
    `Poster style: ${input.referenceLayout.posterStyle}. Background type: ${input.referenceLayout.backgroundType}.`,
    `Main product placement: ${input.referenceLayout.primaryProductPlacement}.`,
    `Packaging present: ${input.referenceLayout.packagingPresent ? "yes" : "no"}. Packaging placement: ${input.referenceLayout.packagingPlacement || "not applicable"}.`,
    `Product and packaging relationship: ${input.referenceLayout.productPackagingRelationship || "not specified"}.`,
    `Camera angle: ${input.referenceLayout.cameraAngle}. Depth and lighting: ${input.referenceLayout.depthAndLighting}.`,
    `Palette cues: ${palette.length ? palette.join(", ") : "match the reference poster palette"}.`,
    `Supporting props to rebuild when helpful: ${props.length ? props.join(", ") : "follow the reference poster only"}.`,
    `Target aspect ratio: ${input.ratio}. Aim for ${input.resolutionLabel} fidelity.`,
    `Product name: ${input.productName}. Brand: ${input.brandName || "Not specified"}. Category: ${input.category}. Platform: ${input.platform}.`,
    `Core selling points: ${input.sellingPoints || "Not provided"}.`,
    `Additional notes: ${input.sourceDescription || "Not provided"}.`,
    `Top banner text: ${input.remakeCopy.topBanner || "(leave empty if no top banner in reference)"}.`,
    `Headline text: ${input.remakeCopy.headline || "(leave empty if no main headline in reference)"}.`,
    `Subheadline text: ${input.remakeCopy.subheadline || "(leave empty if no subheadline in reference)"}.`,
    `Bottom banner text: ${input.remakeCopy.bottomBanner || "(leave empty if no bottom banner in reference)"}.`,
    `Callout texts: ${callouts.length ? callouts.join(" | ") : "(no callout badges required)"}.`,
    isFallback
      ? "Fallback mode: keep the same poster skeleton, block hierarchy, packaging relationship, and scene type, but simplify the visible text. Prefer short readable phrases or label-like banner text over long exact copy."
      : "If the reference poster includes marketplace-style text bars or Chinese-style poster blocks, recreate the same hierarchy and block placement with the new copy instead of inventing a fresh western ad layout.",
    isFallback
      ? "Prioritize these in order: product identity replacement, poster composition match, banner block preservation, packaging/prop relationship, readable short text."
      : "Prioritize these in order: product identity replacement, poster composition match, banner block preservation, packaging/prop relationship, accurate copy slot replacement.",
    "Do not turn this into a generic lifestyle poster unless the reference image itself is that kind of poster.",
    "Do not omit the packaging relationship, text bars, or poster structure if they are present in the reference.",
    `Restrictions: ${input.restrictions || "No unsupported logos, pricing, or medical claims."}.`,
    isFallback
      ? "Avoid distorted packaging, duplicated products, wrong brand replacement, or missing banner blocks. If needed, reduce the amount of text but preserve the top banner, headline region, bottom banner, and overall poster framing."
      : "Avoid distorted packaging, unreadable core text, duplicated products, wrong brand replacement, or missing poster bars.",
  ].join("\n");
}

export function buildReferenceDirectRemakePrompt(input: {
  country: string;
  language: string;
  platform: string;
  category: string;
  productName: string;
  brandName: string;
  brandProfile?: BrandRecord | null;
  sellingPoints: string;
  restrictions: string;
  sourceDescription: string;
  ratio: string;
  resolutionLabel: string;
  referenceStrength: "reference" | "balanced" | "product";
  preserveReferenceText: boolean;
  referenceExtraPrompt?: string;
  referenceNegativePrompt?: string;
  referenceLayoutHints?: ReferenceLayoutAnalysis | null;
  referencePosterCopyHints?: ReferencePosterCopy | null;
  promptVariant?: "strict" | "fallback";
}) {
  const isFallback = input.promptVariant === "fallback";
  const strengthLines = strengthPrompt(input.referenceStrength);
  const extraPrompt = input.referenceExtraPrompt?.trim();
  const negativePrompt = input.referenceNegativePrompt?.trim();
  const callouts = nonEmptyList(input.referencePosterCopyHints?.callouts ?? []);
  const hintLines = [
    input.referenceLayoutHints?.summary ? `Operator layout hint: ${input.referenceLayoutHints.summary}.` : null,
    input.referenceLayoutHints?.backgroundType
      ? `Operator background hint: ${input.referenceLayoutHints.backgroundType}.`
      : null,
    input.referenceLayoutHints?.primaryProductPlacement
      ? `Operator placement hint: ${input.referenceLayoutHints.primaryProductPlacement}.`
      : null,
    input.referenceLayoutHints?.packagingPlacement
      ? `Operator packaging hint: ${input.referenceLayoutHints.packagingPlacement}.`
      : null,
    input.referencePosterCopyHints?.topBanner ? `Operator top banner hint: ${input.referencePosterCopyHints.topBanner}.` : null,
    input.referencePosterCopyHints?.headline ? `Operator headline hint: ${input.referencePosterCopyHints.headline}.` : null,
    input.referencePosterCopyHints?.subheadline
      ? `Operator subheadline hint: ${input.referencePosterCopyHints.subheadline}.`
      : null,
    input.referencePosterCopyHints?.bottomBanner
      ? `Operator bottom banner hint: ${input.referencePosterCopyHints.bottomBanner}.`
      : null,
    callouts.length ? `Operator callout hints: ${callouts.join(" | ")}.` : null,
  ].filter(Boolean);

  return [
    `Remake the second input image as a poster in ${input.language} for market ${input.country}.`,
    "The first image is the real product source. The second image is the exact visual reference poster.",
    "Keep the second image's composition, camera angle, background type, color blocking, packaging relationship, decorative elements, banner bars, text positions, and overall poster feeling as close as possible.",
    "Replace only the reference product with the product from the first image.",
    "Use the first image for product truth only: shape, cap, label placement, material, transparency, reflections, proportions, and recognizable identity.",
    "Do not redesign the poster into a generic lifestyle ad. Keep it looking like the reference poster.",
    ...strengthLines,
    ...buildBrandOverrideLines(input.brandProfile),
    `Target aspect ratio: ${input.ratio}. Aim for ${input.resolutionLabel} fidelity.`,
    `Product name: ${input.productName}. Brand: ${input.brandName || "Not specified"}. Category: ${input.category}. Platform: ${input.platform}.`,
    `Selling points for product understanding only: ${input.sellingPoints || "Not provided"}.`,
    `Additional notes: ${input.sourceDescription || "Not provided"}.`,
    input.preserveReferenceText
      ? "Preserve the reference poster's original visible text content as much as possible. Keep the same text quantity, text hierarchy, font feeling, stroke feeling, banner text style, and approximate line breaks whenever possible."
      : "Text may be adapted, but keep the same number of major text blocks, similar text hierarchy, and the same banner/title layout as the reference.",
    ...hintLines,
    extraPrompt ? `Extra remake guidance: ${extraPrompt}` : null,
    `Restrictions: ${input.restrictions || "No unsupported logos, pricing, or medical claims."}.`,
    negativePrompt ? `Extra avoid instructions: ${negativePrompt}` : null,
    isFallback
      ? "Fallback mode: if exact lettering is difficult, preserve the same text block shapes, colors, and placement first. Prefer approximate readable lettering over changing the poster structure."
      : "Strict mode: preserve the reference poster structure first, including the top bar, bottom bar, main title region, packaging placement, and overall visual hierarchy.",
    isFallback
      ? "Avoid removing banner bars, removing packaging, changing the scene to a generic studio setup, or dropping the poster-like composition."
      : "Avoid generic white-background styling, generic kitchen scenes, duplicated products, distorted packaging, wrong labels, or missing banner blocks.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function toGeneratedCopyBundleFromRemakePoster(copy: ReferencePosterCopy): GeneratedCopyBundle {
  return {
    optimizedPrompt: copy.summary || copy.headline || copy.subheadline || "",
    title: copy.headline || "",
    subtitle: copy.subheadline || "",
    highlights: nonEmptyList(copy.callouts),
    detailAngles: [],
    painPoints: [],
    cta: copy.bottomBanner || "",
    posterHeadline: copy.headline || "",
    posterSubline: copy.subheadline || "",
  };
}

export function buildPromptModeCopyBundle(input: {
  productName: string;
  customPrompt: string;
}): GeneratedCopyBundle {
  return {
    optimizedPrompt: input.customPrompt,
    title: input.productName,
    subtitle: "",
    highlights: [],
    detailAngles: [],
    painPoints: [],
    cta: "",
    posterHeadline: input.productName,
    posterSubline: "",
  };
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
