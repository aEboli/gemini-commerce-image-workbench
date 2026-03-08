import type { CreateJobInput } from "@/lib/db";
import type { AssetRecord, JobDetails, JobItemRecord, UiLanguage } from "@/lib/types";
import { createId, dimensionsForVariant, nowIso } from "@/lib/utils";

export interface CreatePayload {
  productName: string;
  sku: string;
  brandName: string;
  category: string;
  sellingPoints: string;
  restrictions: string;
  sourceDescription: string;
  country: string;
  language: string;
  platform: string;
  selectedTypes: string[];
  selectedRatios: string[];
  selectedResolutions: string[];
  variantsPerType: number;
  includeCopyLayout: boolean;
  uiLanguage: UiLanguage;
}

export function buildJobItems(sourceAssets: AssetRecord[], payload: CreatePayload, jobId: string): JobItemRecord[] {
  const items: JobItemRecord[] = [];
  const now = nowIso();

  for (const sourceAsset of sourceAssets) {
    for (const imageType of payload.selectedTypes) {
      for (const ratio of payload.selectedRatios) {
        for (const resolutionLabel of payload.selectedResolutions) {
          for (let variantIndex = 1; variantIndex <= payload.variantsPerType; variantIndex += 1) {
            const { width, height } = dimensionsForVariant(ratio, resolutionLabel);
            items.push({
              id: createId("item"),
              jobId,
              sourceAssetId: sourceAsset.id,
              sourceAssetName: sourceAsset.originalName,
              imageType: imageType as JobItemRecord["imageType"],
              ratio,
              resolutionLabel,
              width,
              height,
              variantIndex,
              status: "queued",
              promptText: null,
              negativePrompt: null,
              copyJson: null,
              generatedAssetId: null,
              layoutAssetId: null,
              createdAt: now,
              updatedAt: now,
              errorMessage: null,
            });
          }
        }
      }
    }
  }

  return items;
}

export function buildCreateJobInput(sourceAssets: AssetRecord[], payload: CreatePayload, jobId = createId("job")): CreateJobInput {
  const items = buildJobItems(sourceAssets, payload, jobId);

  return {
    id: jobId,
    productName: payload.productName,
    sku: payload.sku,
    category: payload.category,
    brandName: payload.brandName,
    sellingPoints: payload.sellingPoints,
    restrictions: payload.restrictions,
    country: payload.country,
    language: payload.language,
    platform: payload.platform,
    selectedTypes: payload.selectedTypes,
    selectedRatios: payload.selectedRatios,
    selectedResolutions: payload.selectedResolutions,
    variantsPerType: payload.variantsPerType,
    includeCopyLayout: payload.includeCopyLayout,
    batchFileCount: sourceAssets.length,
    sourceDescription: payload.sourceDescription,
    uiLanguage: payload.uiLanguage,
    sourceAssets: sourceAssets.map((asset) => ({ ...asset, jobId })),
    items,
  };
}

export function buildRetryJobInput(details: JobDetails): CreateJobInput {
  const sourceAssets = details.sourceAssets.map((asset) => ({
    ...asset,
    id: createId("asset"),
    jobId: "",
    jobItemId: null,
    createdAt: nowIso(),
  }));

  return buildCreateJobInput(
    sourceAssets,
    {
      productName: details.job.productName,
      sku: details.job.sku,
      brandName: details.job.brandName,
      category: details.job.category,
      sellingPoints: details.job.sellingPoints,
      restrictions: details.job.restrictions,
      sourceDescription: details.job.sourceDescription,
      country: details.job.country,
      language: details.job.language,
      platform: details.job.platform,
      selectedTypes: details.job.selectedTypes,
      selectedRatios: details.job.selectedRatios,
      selectedResolutions: details.job.selectedResolutions,
      variantsPerType: details.job.variantsPerType,
      includeCopyLayout: details.job.includeCopyLayout,
      uiLanguage: details.job.uiLanguage,
    },
  );
}
