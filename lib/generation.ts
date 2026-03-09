import { generateCopyBundle, generateEditedImage, normalizeProviderError, translateCreativeInputs } from "@/lib/gemini";
import { createPosterSvg } from "@/lib/poster";
import {
  getAssetById,
  getBrandByName,
  getJobById,
  getSettings,
  getTemplateById,
  insertAsset,
  listJobItems,
  resolveTemplate,
  updateJobItemFailure,
  updateJobItemProcessing,
  updateJobItemResult,
  updateJobLocalizedInputs,
  updateJobStatus,
} from "@/lib/db";
import { readAssetBuffer, writeFileAsset } from "@/lib/storage";
import type { AssetRecord, ProviderOverride } from "@/lib/types";

function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".png";
  }
}

export async function processJob(jobId: string, providerOverride?: ProviderOverride) {
  const job = getJobById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found.`);
  }

  const settings = getSettings();
  const apiKey = providerOverride?.apiKey || settings.defaultApiKey;
  const apiBaseUrl = providerOverride?.apiBaseUrl ?? settings.defaultApiBaseUrl;
  const apiVersion = providerOverride?.apiVersion ?? settings.defaultApiVersion;
  const apiHeaders = providerOverride?.apiHeaders ?? settings.defaultApiHeaders;

  if (!apiKey) {
    updateJobStatus(jobId, "failed", "Gemini API key is missing.");
    return;
  }

  updateJobStatus(jobId, "processing");
  const items = listJobItems(jobId);
  let successCount = 0;
  let failureCount = 0;

  const localizedInputs = await translateCreativeInputs({
    apiKey,
    textModel: settings.defaultTextModel,
    apiBaseUrl,
    apiVersion,
    apiHeaders,
    country: job.country,
    language: job.language,
    platform: job.platform,
    category: job.category,
    brandName: job.brandName,
    sku: job.sku,
    productName: job.productName,
    sellingPoints: job.sellingPoints,
    restrictions: job.restrictions,
    sourceDescription: job.sourceDescription,
  }).catch(() => null);
  updateJobLocalizedInputs(jobId, localizedInputs);

  const effectiveInputs = {
    productName: localizedInputs?.productName || job.productName,
    sellingPoints: localizedInputs?.sellingPoints || job.sellingPoints,
    restrictions: localizedInputs?.restrictions || job.restrictions,
    sourceDescription: localizedInputs?.sourceDescription || job.sourceDescription,
  };

  for (const item of items) {
    try {
      updateJobItemProcessing(item.id);
      const sourceAsset = getAssetById(item.sourceAssetId);
      if (!sourceAsset) {
        throw new Error("Source asset not found.");
      }

      const sourceBuffer = await readAssetBuffer(sourceAsset);
      const brandProfile = job.brandName ? getBrandByName(job.brandName) : null;
      const overrideTemplateId = job.selectedTemplateOverrides[item.imageType];
      const matchedTemplate =
        (overrideTemplateId ? getTemplateById(overrideTemplateId) : null) ??
        resolveTemplate({
          country: job.country,
          language: job.language,
          platform: job.platform,
          category: job.category,
          imageType: item.imageType,
        });

      const copy = await generateCopyBundle({
        apiKey,
        textModel: settings.defaultTextModel,
        apiBaseUrl,
        apiVersion,
        apiHeaders,
        country: job.country,
        language: job.language,
        platform: job.platform,
        category: job.category,
        brandName: job.brandName,
        productName: effectiveInputs.productName,
        sellingPoints: effectiveInputs.sellingPoints,
        restrictions: effectiveInputs.restrictions,
        sourceDescription: effectiveInputs.sourceDescription,
        brandProfile,
        imageType: item.imageType,
        ratio: item.ratio,
        resolutionLabel: item.resolutionLabel,
        template: matchedTemplate,
      });

      const generated = await generateEditedImage({
        apiKey,
        imageModel: settings.defaultImageModel,
        apiBaseUrl,
        apiVersion,
        apiHeaders,
        country: job.country,
        language: job.language,
        platform: job.platform,
        category: job.category,
        brandName: job.brandName,
        productName: effectiveInputs.productName,
        sellingPoints: effectiveInputs.sellingPoints,
        restrictions: effectiveInputs.restrictions,
        sourceDescription: effectiveInputs.sourceDescription,
        brandProfile,
        imageType: item.imageType,
        ratio: item.ratio,
        resolutionLabel: item.resolutionLabel,
        copy,
        template: matchedTemplate,
        sourceImages: [{ mimeType: sourceAsset.mimeType, buffer: sourceBuffer }],
      });

      const generatedAsset = await writeFileAsset({
        jobId,
        jobItemId: item.id,
        kind: "generated",
        originalName: `${job.productName}-${item.imageType}-${item.variantIndex}${extensionForMimeType(generated.mimeType)}`,
        mimeType: generated.mimeType,
        buffer: generated.buffer,
        width: item.width,
        height: item.height,
      });
      insertAsset(generatedAsset);

      let layoutAsset: AssetRecord | null = null;
      if (job.includeCopyLayout) {
        const posterSvg = createPosterSvg({
          imageBuffer: generated.buffer,
          imageMimeType: generated.mimeType,
          width: item.width,
          height: item.height,
          copy,
          platform: job.platform,
          imageType: item.imageType,
          productName: effectiveInputs.productName,
        });
        layoutAsset = await writeFileAsset({
          jobId,
          jobItemId: item.id,
          kind: "layout",
          originalName: `${job.productName}-${item.imageType}-${item.variantIndex}.svg`,
          mimeType: "image/svg+xml",
          buffer: Buffer.from(posterSvg, "utf8"),
          width: item.width,
          height: item.height,
        });
        insertAsset(layoutAsset);
      }

      updateJobItemResult({
        itemId: item.id,
        promptText: copy.optimizedPrompt,
        copy,
        generatedAssetId: generatedAsset.id,
        layoutAssetId: layoutAsset?.id ?? null,
      });
      successCount += 1;
    } catch (error) {
      failureCount += 1;
      updateJobItemFailure(item.id, normalizeProviderError(error));
    }
  }

  if (successCount > 0 && failureCount > 0) {
    updateJobStatus(jobId, "partial", `${failureCount} variants failed.`);
    return;
  }

  if (successCount > 0) {
    updateJobStatus(jobId, "completed");
    return;
  }

  updateJobStatus(jobId, "failed", "All variants failed to generate.");
}
