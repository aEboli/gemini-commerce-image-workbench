"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { JobDetails, JobItemReviewStatus, UiLanguage } from "@/lib/types";

const CREATE_JOB_PROMPT_PREFILL_KEY = "commerce-image-studio.create-prompt-prefill.v1";

function statusText(language: UiLanguage, status: string) {
  const map = {
    zh: {
      queued: "排队中",
      processing: "生成中",
      completed: "已完成",
      partial: "部分完成",
      failed: "失败",
    },
    en: {
      queued: "Queued",
      processing: "Processing",
      completed: "Completed",
      partial: "Partial",
      failed: "Failed",
    },
  } as const;

  return map[language][status as keyof (typeof map)["zh"]] ?? status;
}

function reviewStatusText(language: UiLanguage, status: JobItemReviewStatus) {
  const map = {
    zh: {
      unreviewed: "待筛选",
      shortlisted: "已入选",
      approved: "已通过",
      rejected: "已淘汰",
    },
    en: {
      unreviewed: "Unreviewed",
      shortlisted: "Shortlisted",
      approved: "Approved",
      rejected: "Rejected",
    },
  } as const;

  return map[language][status];
}

function assetPreviewUrl(assetId: string) {
  return `/api/assets/${assetId}`;
}

function assetDownloadUrl(assetId: string) {
  return `/api/assets/${assetId}?download=1`;
}

function approvedDownloadUrl(jobId: string) {
  return `/api/jobs/${jobId}/approved-download`;
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function formatDimensions(width: number | null | undefined, height: number | null | undefined, emptyLabel: string) {
  if (!width || !height) {
    return emptyLabel;
  }

  return `${width}x${height}`;
}

function formatRatio(width: number | null | undefined, height: number | null | undefined, emptyLabel: string) {
  if (!width || !height) {
    return emptyLabel;
  }

  const knownRatios = [
    { label: "1:1", value: 1 / 1 },
    { label: "4:5", value: 4 / 5 },
    { label: "3:4", value: 3 / 4 },
    { label: "16:9", value: 16 / 9 },
    { label: "9:16", value: 9 / 16 },
  ];

  const actual = width / height;
  const matched = knownRatios.find((ratio) => Math.abs(ratio.value - actual) <= 0.03);
  if (matched) {
    return matched.label;
  }

  const gcd = (left: number, right: number): number => (right === 0 ? left : gcd(right, left % right));
  const divisor = gcd(width, height);
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

export function JobDetailsClient({
  initialDetails,
  language,
}: {
  initialDetails: JobDetails;
  language: UiLanguage;
}) {
  const router = useRouter();
  const [details, setDetails] = useState(initialDetails);
  const [errorMessage, setErrorMessage] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (!["queued", "processing"].includes(details.job.status)) {
      return;
    }

    const timer = setInterval(async () => {
      const response = await fetch(`/api/jobs/${details.job.id}`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const body = (await response.json()) as JobDetails;
      setDetails(body);
    }, 3500);

    return () => clearInterval(timer);
  }, [details.job.id, details.job.status]);

  useEffect(() => {
    if (!copiedFieldId) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopiedFieldId(null);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [copiedFieldId]);

  const text = useMemo(
    () =>
      language === "zh"
        ? {
            "heading": "\u4efb\u52a1\u8be6\u60c5",
            "translatedInfo": "\u539f\u59cb\u8f93\u5165 vs \u81ea\u52a8\u7ffb\u8bd1\u540e\u8f93\u5165",
            "translatedHint": "\u5de6\u4fa7\u662f\u4f60\u586b\u5199\u7684\u539f\u59cb\u57fa\u7840\u4fe1\u606f\uff0c\u53f3\u4fa7\u662f\u7cfb\u7edf\u5728\u751f\u6210\u524d\u81ea\u52a8\u7ffb\u8bd1\u6210\u5f53\u524d\u8f93\u51fa\u8bed\u8a00\u540e\u7684\u7248\u672c\uff0c\u6a21\u578b\u5b9e\u9645\u4f7f\u7528\u7684\u662f\u53f3\u4fa7\u5185\u5bb9\u3002",
            "originalInfo": "\u539f\u59cb\u8f93\u5165",
            "localizedInfo": "\u81ea\u52a8\u7ffb\u8bd1\u540e\u8f93\u5165",
            "translatedProductName": "\u5546\u54c1\u540d",
            "translatedSellingPoints": "\u6838\u5fc3\u5356\u70b9",
            "translatedRestrictions": "\u9650\u5236\u8bcd / \u7981\u7528\u5185\u5bb9",
            "translatedSourceDescription": "\u8865\u5145\u8bf4\u660e",
            "copy": "\u590d\u5236",
            "copied": "\u5df2\u590d\u5236",
            "reusePrompt": "\u56de\u586b\u5230\u521b\u4f5c\u53f0\u9ad8\u7ea7\u63d0\u793a\u8bcd",
            "sourceImages": "\u5546\u54c1\u539f\u56fe",
            "referenceImages": "\u53c2\u8003\u56fe",
            "creationMode": "\u751f\u6210\u6a21\u5f0f",
            "standardMode": "\u6807\u51c6\u51fa\u56fe",
            "promptMode": "\u63d0\u793a\u8bcd\u6a21\u5f0f",
            "referenceMode": "\u53c2\u8003\u56fe\u590d\u523b",
            "referenceStrength": "\u590d\u523b\u5f3a\u5ea6",
            "strengthReference": "\u66f4\u50cf\u53c2\u8003\u56fe",
            "strengthBalanced": "\u5e73\u8861",
            "strengthProduct": "\u66f4\u50cf\u539f\u5546\u54c1\u573a\u666f",
            "referenceLayout": "\u53c2\u8003\u56fe\u5206\u6790\u6458\u8981",
            "referencePosterCopy": "\u6d77\u62a5\u69fd\u4f4d\u6587\u6848",
            "variants": "\u53d8\u4f53\u7ed3\u679c",
            "generated": "\u7eaf\u56fe\u7247",
            "layout": "\u6587\u6848\u56fe",
            "compare": "\u7ed3\u679c\u5bf9\u6bd4",
            "addCompare": "\u52a0\u5165\u5bf9\u6bd4",
            "removeCompare": "\u79fb\u51fa\u5bf9\u6bd4",
            "clearCompare": "\u6e05\u7a7a\u5bf9\u6bd4",
            "compareHint": "\u6700\u591a\u53ef\u540c\u65f6\u5bf9\u6bd4 4 \u4e2a\u7ed3\u679c\uff0c\u65b9\u4fbf\u66f4\u5feb\u9009\u51fa\u53ef\u7528\u56fe\u3002",
            "comparePickMore": "\u518d\u9009 1 \u5f20\u5373\u53ef\u8fdb\u5165\u5bf9\u6bd4\u89c6\u56fe\u3002",
            "shortlisted": "\u5165\u9009",
            "approved": "\u901a\u8fc7",
            "rejected": "\u6dd8\u6c70",
            "resetReview": "\u91cd\u7f6e",
            "prompt": "\u5b9e\u9645\u53d1\u9001\u7ed9\u6a21\u578b\u7684\u63d0\u793a\u8bcd",
            "directPrompt": "\u672c\u6b21\u5b9e\u9645\u53d1\u9001\u7ed9\u6a21\u578b\u7684\u76f4\u9a71\u590d\u523b prompt",
            "download": "\u4e0b\u8f7d",
            "downloadApproved": "\u6279\u91cf\u4e0b\u8f7d\u5df2\u901a\u8fc7\u56fe\u7247",
            "approvedSummary": "\u5df2\u901a\u8fc7 {count} \u7ec4\u7ed3\u679c\uff0c\u53ef\u4e00\u952e\u6253\u5305\u4e0b\u8f7d\u3002",
            "noApproved": "\u8fd8\u6ca1\u6709\u5df2\u901a\u8fc7\u7ed3\u679c\uff0c\u5148\u6311\u51fa\u4f60\u60f3\u4fdd\u7559\u7684\u56fe\u7247\u3002",
            "rerun": "\u518d\u6b21\u751f\u6210",
            "retryError": "\u91cd\u8bd5\u5931\u8d25",
            "jobError": "\u4efb\u52a1\u5931\u8d25\u539f\u56e0",
            "summary": "\u6458\u8981",
            "palette": "\u914d\u8272",
            "backgroundType": "\u80cc\u666f\u7c7b\u578b",
            "primaryPlacement": "\u4e3b\u5546\u54c1\u4f4d\u7f6e",
            "packagingPlacement": "\u5305\u88c5\u4f4d\u7f6e",
            "packagingRelationship": "\u5546\u54c1\u4e0e\u5305\u88c5\u5173\u7cfb",
            "camera": "\u955c\u5934\u89d2\u5ea6",
            "lighting": "\u5149\u7ebf\u4e0e\u666f\u6df1",
            "props": "\u8f85\u52a9\u5143\u7d20",
            "topBanner": "\u9876\u90e8\u6a2a\u5e45",
            "headline": "\u4e3b\u6807\u9898",
            "subheadline": "\u526f\u6807\u9898",
            "bottomBanner": "\u5e95\u90e8\u6a2a\u5e45",
            "callouts": "\u89d2\u6807 / \u5356\u70b9\u77ed\u53e5",
            "empty": "\u65e0",
            "unknown": "\u672a\u77e5",
            "separator": " \u00b7 ",
            "variantSummary": "{total} \u4e2a\u751f\u6210\u9879\u4e2d {success} \u4e2a\u6210\u529f\uff0c{failed} \u4e2a\u5931\u8d25\u3002",
            "providerDownloadSummary": "{count} \u4e2a\u5931\u8d25\u9879\u53d1\u751f\u5728\u4e0b\u8f7d\u4e2d\u8f6c\u8fd4\u56de\u56fe\u7247\u65f6\u3002",
            "warningSummary": "{count} \u4e2a\u6210\u529f\u9879\u7684\u5b9e\u9645\u5c3a\u5bf8\u4e0e\u8bf7\u6c42\u4e0d\u4e00\u81f4\u3002",
            "requestSize": "\u8bf7\u6c42\u5c3a\u5bf8",
            "actualSize": "\u5b9e\u9645\u5c3a\u5bf8",
            "requestRatio": "\u8bf7\u6c42\u6bd4\u4f8b",
            "actualRatio": "\u5b9e\u9645\u6bd4\u4f8b",
            "warning": "\u5c3a\u5bf8\u8b66\u544a",
            "providerImageUrl": "\u4e2d\u8f6c\u8fd4\u56de\u56fe\u7247 URL",
            "openLink": "\u6253\u5f00\u94fe\u63a5",
            "rawProviderResponse": "\u4e2d\u8f6c\u539f\u59cb\u8fd4\u56de",
            "failureReason": "\u5931\u8d25\u8be6\u60c5"
}
        : {
            "heading": "Job details",
            "translatedInfo": "Original vs translated inputs",
            "translatedHint": "The left side shows your original base inputs. The right side shows the auto-translated version in the current output language that the model actually used.",
            "originalInfo": "Original input",
            "localizedInfo": "Auto-translated input",
            "translatedProductName": "Product name",
            "translatedSellingPoints": "Selling points",
            "translatedRestrictions": "Restrictions / banned content",
            "translatedSourceDescription": "Additional notes",
            "copy": "Copy",
            "copied": "Copied",
            "reusePrompt": "Reuse in create page advanced prompt",
            "sourceImages": "Source images",
            "referenceImages": "Reference images",
            "creationMode": "Creation mode",
            "standardMode": "Standard",
            "promptMode": "Prompt mode",
            "referenceMode": "Reference remake",
            "referenceStrength": "Remake strength",
            "strengthReference": "Closer to reference",
            "strengthBalanced": "Balanced",
            "strengthProduct": "Closer to product scene",
            "referenceLayout": "Reference layout analysis",
            "referencePosterCopy": "Poster copy slots",
            "variants": "Variants",
            "generated": "Pure image",
            "layout": "Layout creative",
            "compare": "Compare results",
            "addCompare": "Add to compare",
            "removeCompare": "Remove",
            "clearCompare": "Clear compare",
            "compareHint": "Compare up to 4 outputs at once and pick the best candidate faster.",
            "comparePickMore": "Pick one more result to enter compare view.",
            "shortlisted": "Shortlist",
            "approved": "Approve",
            "rejected": "Reject",
            "resetReview": "Reset",
            "prompt": "Prompt sent to the model",
            "directPrompt": "Direct remake prompt sent to the model",
            "download": "Download",
            "downloadApproved": "Download approved ZIP",
            "approvedSummary": "{count} approved variants are ready for batch download.",
            "noApproved": "No approved variants yet. Mark a few results first.",
            "rerun": "Run again",
            "retryError": "Retry failed",
            "jobError": "Job failure reason",
            "summary": "Summary",
            "palette": "Palette",
            "backgroundType": "Background type",
            "primaryPlacement": "Primary product placement",
            "packagingPlacement": "Packaging placement",
            "packagingRelationship": "Product / packaging relationship",
            "camera": "Camera angle",
            "lighting": "Lighting and depth",
            "props": "Supporting props",
            "topBanner": "Top banner",
            "headline": "Headline",
            "subheadline": "Subheadline",
            "bottomBanner": "Bottom banner",
            "callouts": "Callouts",
            "empty": "None",
            "unknown": "Unknown",
            "separator": " \u00b7 ",
            "variantSummary": "{total} variants requested: {success} succeeded, {failed} failed.",
            "providerDownloadSummary": "{count} failed while downloading provider-returned image URLs.",
            "warningSummary": "{count} successful variants returned a different size than requested.",
            "requestSize": "Requested size",
            "actualSize": "Actual size",
            "requestRatio": "Requested ratio",
            "actualRatio": "Actual ratio",
            "warning": "Size warning",
            "providerImageUrl": "Provider image URL",
            "openLink": "Open link",
            "rawProviderResponse": "Raw provider response",
            "failureReason": "Failure details"
},
    [language],
  );

  const detailRows = details.job.localizedInputs
    ? [
        {
          key: "productName",
          label: text.translatedProductName,
          originalValue: details.job.productName,
          localizedValue: details.job.localizedInputs.productName,
        },
        {
          key: "sellingPoints",
          label: text.translatedSellingPoints,
          originalValue: details.job.sellingPoints,
          localizedValue: details.job.localizedInputs.sellingPoints,
        },
        {
          key: "restrictions",
          label: text.translatedRestrictions,
          originalValue: details.job.restrictions,
          localizedValue: details.job.localizedInputs.restrictions,
        },
        {
          key: "sourceDescription",
          label: text.translatedSourceDescription,
          originalValue: details.job.sourceDescription,
          localizedValue: details.job.localizedInputs.sourceDescription,
        },
      ].filter((row) => Boolean(row.originalValue.trim()) || Boolean(row.localizedValue.trim()))
    : [];

  const referenceStrengthText =
    details.job.referenceStrength === "reference"
      ? text.strengthReference
      : details.job.referenceStrength === "product"
        ? text.strengthProduct
        : text.strengthBalanced;

  const comparableItems = details.items.filter((item) => item.generatedAsset);
  const comparedItems = comparableItems.filter((item) => compareIds.includes(item.id));
  const approvedItems = details.items.filter(
    (item) => item.reviewStatus === "approved" && (item.generatedAsset || item.layoutAsset),
  );
  const approvedSummaryText =
    approvedItems.length > 0
      ? text.approvedSummary.replace("{count}", String(approvedItems.length))
      : text.noApproved;
  const referenceLayoutJson = details.job.referenceLayoutAnalysis
    ? JSON.stringify(details.job.referenceLayoutAnalysis, null, 2)
    : "";
  const referencePosterCopyJson = details.job.referencePosterCopy
    ? JSON.stringify(details.job.referencePosterCopy, null, 2)
    : "";
  const actualPromptLabel = details.job.creationMode === "reference-remix" ? text.directPrompt : text.prompt;
  const creationModeLabel =
    details.job.creationMode === "reference-remix"
      ? text.referenceMode
      : details.job.creationMode === "prompt"
        ? text.promptMode
        : text.standardMode;
  const getDimensionWarning = (item: (typeof details.items)[number]) => {
    if (item.warningMessage) {
      return item.warningMessage;
    }

    if (!item.generatedAsset?.width || !item.generatedAsset?.height) {
      return null;
    }

    if (item.generatedAsset.width === item.width && item.generatedAsset.height === item.height) {
      return null;
    }

    return `${text.requestSize}: ${formatDimensions(item.width, item.height, text.unknown)} / ${text.requestRatio}: ${
      item.ratio
    }. ${text.actualSize}: ${formatDimensions(item.generatedAsset.width, item.generatedAsset.height, text.unknown)} / ${
      text.actualRatio
    }: ${formatRatio(item.generatedAsset.width, item.generatedAsset.height, text.unknown)}.`;
  };
  const succeededCount = details.items.filter((item) => item.generatedAsset || item.layoutAsset).length;
  const failedItems = details.items.filter((item) => item.status === "failed");
  const providerDownloadFailures = failedItems.filter(
    (item) => item.providerDebug?.failureStage === "provider-image-download",
  ).length;
  const warningCount = details.items.filter((item) => Boolean(getDimensionWarning(item))).length;
  const variantSummaryText = text.variantSummary
    .replace("{total}", String(details.items.length))
    .replace("{success}", String(succeededCount))
    .replace("{failed}", String(failedItems.length));
  const providerDownloadSummaryText =
    providerDownloadFailures > 0
      ? text.providerDownloadSummary.replace("{count}", String(providerDownloadFailures))
      : "";
  const warningSummaryText =
    warningCount > 0 ? text.warningSummary.replace("{count}", String(warningCount)) : "";

  async function handleCopy(fieldId: string, value: string) {
    try {
      await copyToClipboard(value || "-");
      setCopiedFieldId(fieldId);
    } catch {
      setErrorMessage(text.retryError);
    }
  }

  async function handleRetry() {
    setErrorMessage("");
    const response = await fetch(`/api/jobs/${details.job.id}/retry`, { method: "POST" });
    if (!response.ok) {
      setErrorMessage(text.retryError);
      return;
    }
    const body = (await response.json()) as { jobId: string };
    router.push(`/jobs/${body.jobId}`);
  }

  async function handleReviewUpdate(itemId: string, reviewStatus: JobItemReviewStatus) {
    const response = await fetch(`/api/job-items/${itemId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus }),
    });

    if (!response.ok) {
      return;
    }

    const updatedItem = (await response.json()) as { id: string; reviewStatus: JobItemReviewStatus };
    setDetails((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === updatedItem.id ? { ...item, reviewStatus: updatedItem.reviewStatus } : item,
      ),
    }));
  }

  function handleReusePrompt(item: (typeof details.items)[number]) {
    if (!item.promptText) {
      return;
    }

    window.localStorage.setItem(
      CREATE_JOB_PROMPT_PREFILL_KEY,
      JSON.stringify({
        promptText: item.promptText,
        productName: details.job.productName,
        brandName: details.job.brandName,
        category: details.job.category,
        country: details.job.country,
        language: details.job.language,
        platform: details.job.platform,
        ratio: item.ratio,
        resolution: item.resolutionLabel,
        creationMode: details.job.creationMode,
        customNegativePrompt: details.job.customNegativePrompt,
        referenceStrength: details.job.referenceStrength,
      }),
    );

    router.push("/create");
  }

  function toggleCompare(itemId: string) {
    setCompareIds((current) => {
      if (current.includes(itemId)) {
        return current.filter((id) => id !== itemId);
      }
      if (current.length >= 4) {
        return current;
      }
      return [...current, itemId];
    });
  }

  function joinOrEmpty(values: string[]) {
    return values.length ? values.join(" / ") : text.empty;
  }

  return (
    <div className="stack gap-24">
      <section className="panel split-header">
        <div>
          <p className="eyebrow">{text.heading}</p>
          <h2>{details.job.productName}</h2>
          <p className="helper">
            {details.job.platform}
            {text.separator}
            {details.job.language}
            {text.separator}
            {statusText(language, details.job.status)}
          </p>
          <p className="helper">
            {text.creationMode}
            {text.separator}
            {creationModeLabel}
          </p>
          {details.job.creationMode === "reference-remix" ? (
            <p className="helper">
              {text.referenceStrength}
              {text.separator}
              {referenceStrengthText}
            </p>
          ) : null}
          <p className="helper">{variantSummaryText}</p>
          {providerDownloadSummaryText ? <p className="helper">{providerDownloadSummaryText}</p> : null}
          {warningSummaryText ? <p className="helper warning-text">{warningSummaryText}</p> : null}
          <p className="helper">{approvedSummaryText}</p>
        </div>
        <div className="button-row header-actions">
          {approvedItems.length ? (
            <a className="ghost-button" href={approvedDownloadUrl(details.job.id)}>
              {text.downloadApproved}
            </a>
          ) : (
            <button className="ghost-button" disabled type="button">
              {text.downloadApproved}
            </button>
          )}
          <button className="ghost-button" onClick={handleRetry} type="button">
            {text.rerun}
          </button>
        </div>
      </section>

      {details.job.errorMessage ? (
        <section className="panel">
          <h3>{text.jobError}</h3>
          <p className="error-text">{details.job.errorMessage}</p>
        </section>
      ) : null}

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {detailRows.length ? (
        <section className="panel">
          <div className="split-header compact">
            <div>
              <h3>{text.translatedInfo}</h3>
              <p className="helper">{text.translatedHint}</p>
            </div>
          </div>
          <div className="detail-compare-grid">
            <section className="detail-compare-column" aria-label={text.originalInfo}>
              <div className="detail-compare-heading">
                <h4>{text.originalInfo}</h4>
              </div>
              <dl className="detail-kv-grid single-column">
                {detailRows.map((row) => {
                  const fieldId = `original-${row.key}`;
                  return (
                    <div className="detail-kv-card" key={fieldId}>
                      <div className="detail-kv-head">
                        <dt>{row.label}</dt>
                        <button
                          className={`copy-chip-button${copiedFieldId === fieldId ? " is-copied" : ""}`}
                          onClick={() => handleCopy(fieldId, row.originalValue)}
                          type="button"
                        >
                          {copiedFieldId === fieldId ? text.copied : text.copy}
                        </button>
                      </div>
                      <dd>{row.originalValue || "-"}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>

            <section className="detail-compare-column" aria-label={text.localizedInfo}>
              <div className="detail-compare-heading">
                <h4>{text.localizedInfo}</h4>
              </div>
              <dl className="detail-kv-grid single-column">
                {detailRows.map((row) => {
                  const fieldId = `localized-${row.key}`;
                  return (
                    <div className="detail-kv-card" key={fieldId}>
                      <div className="detail-kv-head">
                        <dt>{row.label}</dt>
                        <button
                          className={`copy-chip-button${copiedFieldId === fieldId ? " is-copied" : ""}`}
                          onClick={() => handleCopy(fieldId, row.localizedValue)}
                          type="button"
                        >
                          {copiedFieldId === fieldId ? text.copied : text.copy}
                        </button>
                      </div>
                      <dd>{row.localizedValue || "-"}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          </div>
        </section>
      ) : null}

      {details.job.creationMode === "reference-remix" && details.job.referenceLayoutAnalysis ? (
        <section className="panel">
          <h3>{text.referenceLayout}</h3>
          <dl className="detail-kv-grid single-column">
            <div className="detail-kv-card">
              <dt>{text.summary}</dt>
              <dd>{details.job.referenceLayoutAnalysis.summary || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.backgroundType}</dt>
              <dd>{details.job.referenceLayoutAnalysis.backgroundType || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.primaryPlacement}</dt>
              <dd>{details.job.referenceLayoutAnalysis.primaryProductPlacement || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.packagingPlacement}</dt>
              <dd>{details.job.referenceLayoutAnalysis.packagingPlacement || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.packagingRelationship}</dt>
              <dd>{details.job.referenceLayoutAnalysis.productPackagingRelationship || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.camera}</dt>
              <dd>{details.job.referenceLayoutAnalysis.cameraAngle || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.lighting}</dt>
              <dd>{details.job.referenceLayoutAnalysis.depthAndLighting || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.palette}</dt>
              <dd>{joinOrEmpty(details.job.referenceLayoutAnalysis.palette)}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.props}</dt>
              <dd>{joinOrEmpty(details.job.referenceLayoutAnalysis.supportingProps)}</dd>
            </div>
            <div className="detail-kv-card">
              <div className="detail-kv-head">
                <dt>JSON</dt>
                <button
                  className={`copy-chip-button${copiedFieldId === "reference-layout-json" ? " is-copied" : ""}`}
                  onClick={() => handleCopy("reference-layout-json", referenceLayoutJson)}
                  type="button"
                >
                  {copiedFieldId === "reference-layout-json" ? text.copied : text.copy}
                </button>
              </div>
              <dd>
                <pre className="json-block">{referenceLayoutJson}</pre>
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {details.job.creationMode === "reference-remix" && details.job.referencePosterCopy ? (
        <section className="panel">
          <h3>{text.referencePosterCopy}</h3>
          <dl className="detail-kv-grid single-column">
            <div className="detail-kv-card">
              <dt>{text.summary}</dt>
              <dd>{details.job.referencePosterCopy.summary || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.topBanner}</dt>
              <dd>{details.job.referencePosterCopy.topBanner || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.headline}</dt>
              <dd>{details.job.referencePosterCopy.headline || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.subheadline}</dt>
              <dd>{details.job.referencePosterCopy.subheadline || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.bottomBanner}</dt>
              <dd>{details.job.referencePosterCopy.bottomBanner || text.empty}</dd>
            </div>
            <div className="detail-kv-card">
              <dt>{text.callouts}</dt>
              <dd>{joinOrEmpty(details.job.referencePosterCopy.callouts)}</dd>
            </div>
            <div className="detail-kv-card">
              <div className="detail-kv-head">
                <dt>JSON</dt>
                <button
                  className={`copy-chip-button${copiedFieldId === "reference-poster-copy-json" ? " is-copied" : ""}`}
                  onClick={() => handleCopy("reference-poster-copy-json", referencePosterCopyJson)}
                  type="button"
                >
                  {copiedFieldId === "reference-poster-copy-json" ? text.copied : text.copy}
                </button>
              </div>
              <dd>
                <pre className="json-block">{referencePosterCopyJson}</pre>
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {comparedItems.length ? (
        <section className="panel">
          <div className="split-header compact">
            <div>
              <h3>{text.compare}</h3>
              <p className="helper">{text.compareHint}</p>
            </div>
            <button className="ghost-button" onClick={() => setCompareIds([])} type="button">
              {text.clearCompare}
            </button>
          </div>
          {comparedItems.length < 2 ? <p className="helper">{text.comparePickMore}</p> : null}
          <div className="compare-grid">
            {comparedItems.map((item) => (
              <article className="compare-card" key={item.id}>
                <img alt={item.generatedAsset?.originalName || item.id} src={assetPreviewUrl(item.generatedAsset!.id)} />
                <div className="compare-card-meta">
                  <strong>
                    {item.imageType}
                    {text.separator}
                    {item.ratio}
                    {text.separator}
                    {item.resolutionLabel}
                    {text.separator}#{item.variantIndex}
                  </strong>
                  <span className={`review-status-chip is-${item.reviewStatus}`}>
                    {reviewStatusText(language, item.reviewStatus)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h3>{text.sourceImages}</h3>
        <div className="asset-grid compact">
          {details.sourceAssets.map((asset) => (
            <figure key={asset.id} className="asset-card">
              <img alt={asset.originalName} src={assetPreviewUrl(asset.id)} />
              <figcaption>{asset.originalName}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {details.referenceAssets.length ? (
        <section className="panel">
          <h3>{text.referenceImages}</h3>
          <div className="asset-grid compact">
            {details.referenceAssets.map((asset) => (
              <figure key={asset.id} className="asset-card">
                <img alt={asset.originalName} src={assetPreviewUrl(asset.id)} />
                <figcaption>{asset.originalName}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h3>{text.variants}</h3>
        <div className="variant-list">
          {details.items.map((item) => {
            const dimensionWarning = getDimensionWarning(item);

            return (
            <article className="variant-card" key={item.id}>
              <header className="variant-header">
                <div>
                  <h4>
                    {item.imageType}
                    {text.separator}
                    {item.ratio}
                    {text.separator}
                    {item.resolutionLabel}
                    {text.separator}#{item.variantIndex}
                  </h4>
                  <p className="helper">{statusText(language, item.status)}</p>
                </div>
                <div className="variant-toolbar">
                  <span className={`review-status-chip is-${item.reviewStatus}`}>
                    {reviewStatusText(language, item.reviewStatus)}
                  </span>
                  {item.generatedAsset ? (
                    <button className="ghost-button mini-button" onClick={() => toggleCompare(item.id)} type="button">
                      {compareIds.includes(item.id) ? text.removeCompare : text.addCompare}
                    </button>
                  ) : null}
                </div>
              </header>

              <div className="asset-grid">
                {item.generatedAsset ? (
                  <figure className="asset-card">
                    <img alt={item.generatedAsset.originalName} src={assetPreviewUrl(item.generatedAsset.id)} />
                    <figcaption>
                      {text.generated}
                      <a download href={assetDownloadUrl(item.generatedAsset.id)}>
                        {text.download}
                      </a>
                    </figcaption>
                  </figure>
                ) : null}
                {item.layoutAsset ? (
                  <figure className="asset-card">
                    <img alt={item.layoutAsset.originalName} src={assetPreviewUrl(item.layoutAsset.id)} />
                    <figcaption>
                      {text.layout}
                      <a download href={assetDownloadUrl(item.layoutAsset.id)}>
                        {text.download}
                      </a>
                    </figcaption>
                  </figure>
                ) : null}
              </div>

              <div className="variant-metadata-grid">
                <div className="variant-metadata-card">
                  <span className="helper">{text.requestSize}</span>
                  <strong>{formatDimensions(item.width, item.height, text.unknown)}</strong>
                </div>
                <div className="variant-metadata-card">
                  <span className="helper">{text.actualSize}</span>
                  <strong>
                    {formatDimensions(item.generatedAsset?.width ?? null, item.generatedAsset?.height ?? null, text.unknown)}
                  </strong>
                </div>
                <div className="variant-metadata-card">
                  <span className="helper">{text.requestRatio}</span>
                  <strong>{item.ratio}</strong>
                </div>
                <div className="variant-metadata-card">
                  <span className="helper">{text.actualRatio}</span>
                  <strong>
                    {formatRatio(item.generatedAsset?.width ?? null, item.generatedAsset?.height ?? null, text.unknown)}
                  </strong>
                </div>
              </div>

              {dimensionWarning ? (
                <div className="provider-debug-panel">
                  <div className="detail-kv-head">
                    <strong>{text.warning}</strong>
                  </div>
                  <p className="warning-text">{dimensionWarning}</p>
                </div>
              ) : null}

              <div className="variant-actions">
                <button className="ghost-button mini-button" onClick={() => handleReviewUpdate(item.id, "shortlisted")} type="button">
                  {text.shortlisted}
                </button>
                <button className="ghost-button mini-button" onClick={() => handleReviewUpdate(item.id, "approved")} type="button">
                  {text.approved}
                </button>
                <button className="ghost-button mini-button danger-button" onClick={() => handleReviewUpdate(item.id, "rejected")} type="button">
                  {text.rejected}
                </button>
                <button className="ghost-button mini-button" onClick={() => handleReviewUpdate(item.id, "unreviewed")} type="button">
                  {text.resetReview}
                </button>
              </div>

              {item.copy ? (
                <div className="copy-panel">
                  <strong>{item.copy.title || details.job.productName}</strong>
                  {item.copy.subtitle ? <p>{item.copy.subtitle}</p> : null}
                  {item.copy.highlights.length ? (
                    <ul>
                      {item.copy.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : item.errorMessage ? (
                <>
                  <p className="error-text">{item.errorMessage}</p>
                  {item.providerDebug?.imageUrl || item.providerDebug?.failureReason || item.providerDebug?.rawText ? (
                    <div className="provider-debug-panel">
                      {item.providerDebug?.imageUrl ? (
                        <div className="detail-kv-card provider-debug-card">
                          <div className="detail-kv-head">
                            <dt>{text.providerImageUrl}</dt>
                            <div className="button-row compact-row">
                              <a className="ghost-button mini-button" href={item.providerDebug.imageUrl} rel="noreferrer" target="_blank">
                                {text.openLink}
                              </a>
                              <button
                                className={`copy-chip-button${copiedFieldId === `provider-url-${item.id}` ? " is-copied" : ""}`}
                                onClick={() => handleCopy(`provider-url-${item.id}`, item.providerDebug?.imageUrl || "")}
                                type="button"
                              >
                                {copiedFieldId === `provider-url-${item.id}` ? text.copied : text.copy}
                              </button>
                            </div>
                          </div>
                          <dd>{item.providerDebug.imageUrl}</dd>
                        </div>
                      ) : null}
                      {item.providerDebug?.failureReason ? (
                        <div className="detail-kv-card provider-debug-card">
                          <dt>{text.failureReason}</dt>
                          <dd>{item.providerDebug.failureReason}</dd>
                        </div>
                      ) : null}
                      {item.providerDebug?.rawText ? (
                        <details className="provider-debug-details">
                          <summary>{text.rawProviderResponse}</summary>
                          <pre className="json-block prompt-block">{item.providerDebug.rawText}</pre>
                        </details>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : null}

              {item.promptText ? (
                <div className="prompt-debug-panel">
                  <div className="detail-kv-head">
                    <strong>{actualPromptLabel}</strong>
                    <div className="button-row compact-row">
                      {details.job.creationMode === "reference-remix" ? (
                        <button className="ghost-button mini-button" onClick={() => handleReusePrompt(item)} type="button">
                          {text.reusePrompt}
                        </button>
                      ) : null}
                      <button
                        className={`copy-chip-button${copiedFieldId === `prompt-${item.id}` ? " is-copied" : ""}`}
                        onClick={() => handleCopy(`prompt-${item.id}`, item.promptText || "")}
                        type="button"
                      >
                        {copiedFieldId === `prompt-${item.id}` ? text.copied : text.copy}
                      </button>
                    </div>
                  </div>
                  <pre className="json-block prompt-block">{item.promptText}</pre>
                </div>
              ) : null}
            </article>
          )})}
        </div>
      </section>
    </div>
  );
}
