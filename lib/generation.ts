import { generateCopyBundle, generateEditedImage, normalizeProviderError } from "@/lib/gemini";
import { createPosterSvg } from "@/lib/poster";
import {
  getAssetById,
  getJobById,
  getSettings,
  insertAsset,
  listJobItems,
  updateJobItemFailure,
  updateJobItemProcessing,
  updateJobItemResult,
  updateJobStatus,
} from "@/lib/db";
import { readAssetBuffer, writeFileAsset } from "@/lib/storage";
import type { AssetRecord } from "@/lib/types";

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

export async function processJob(jobId: string, overrideApiKey?: string) {
  const job = getJobById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found.`);
  }

  const settings = getSettings();
  const apiKey = overrideApiKey || settings.defaultApiKey;
  if (!apiKey) {
    updateJobStatus(jobId, "failed", "Gemini API key is missing.");
    return;
  }

  updateJobStatus(jobId, "processing");
  const items = listJobItems(jobId);
  let successCount = 0;
  let failureCount = 0;

  for (const item of items) {
    try {
      updateJobItemProcessing(item.id);
      const sourceAsset = getAssetById(item.sourceAssetId);
      if (!sourceAsset) {
        throw new Error("Source asset not found.");
      }

      const sourceBuffer = await readAssetBuffer(sourceAsset);
      const copy = await generateCopyBundle({
        apiKey,
        textModel: settings.defaultTextModel,
        apiBaseUrl: settings.defaultApiBaseUrl,
        apiVersion: settings.defaultApiVersion,
        apiHeaders: settings.defaultApiHeaders,
        country: job.country,
        language: job.language,
        platform: job.platform,
        category: job.category,
        brandName: job.brandName,
        productName: job.productName,
        sellingPoints: job.sellingPoints,
        restrictions: job.restrictions,
        imageType: item.imageType,
        ratio: item.ratio,
        resolutionLabel: item.resolutionLabel,
      });

      const generated = await generateEditedImage({
        apiKey,
        imageModel: settings.defaultImageModel,
        apiBaseUrl: settings.defaultApiBaseUrl,
        apiVersion: settings.defaultApiVersion,
        apiHeaders: settings.defaultApiHeaders,
        country: job.country,
        language: job.language,
        platform: job.platform,
        category: job.category,
        brandName: job.brandName,
        productName: job.productName,
        sellingPoints: job.sellingPoints,
        restrictions: job.restrictions,
        imageType: item.imageType,
        ratio: item.ratio,
        resolutionLabel: item.resolutionLabel,
        copy,
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
          productName: job.productName,
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
