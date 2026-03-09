"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { JobDetails, JobItemReviewStatus, UiLanguage } from "@/lib/types";

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
            heading: "任务详情",
            translatedInfo: "原始输入 vs 自动翻译后输入",
            translatedHint:
              "左侧是你填写的基础信息，右侧是系统在生成前自动翻译成当前输出语言后的版本，模型实际使用的是右侧内容。",
            originalInfo: "原始输入",
            localizedInfo: "自动翻译后输入",
            translatedProductName: "商品名",
            translatedSellingPoints: "核心卖点",
            translatedRestrictions: "限制词 / 禁用内容",
            translatedSourceDescription: "补充说明",
            copy: "复制",
            copied: "已复制",
            sourceImages: "原图",
            variants: "变体结果",
            generated: "纯图片",
            layout: "文案图",
            compare: "结果对比",
            addCompare: "加入对比",
            removeCompare: "移出对比",
            clearCompare: "清空对比",
            compareHint: "最多可同时对比 4 个结果，方便快速挑出最优图。",
            comparePickMore: "再选 1 张即可进入对比视图。",
            shortlisted: "入选",
            approved: "通过",
            rejected: "淘汰",
            resetReview: "重置",
            prompt: "优化提示词",
            download: "下载",
            downloadApproved: "批量下载已通过图片",
            approvedSummary: "已通过 {count} 组结果，可一键打包下载。",
            noApproved: "还没有已通过结果，先挑出你想保留的图片。",
            rerun: "再次生成",
            error: "重试失败",
            separator: " · ",
          }
        : {
            heading: "Job details",
            translatedInfo: "Original vs translated inputs",
            translatedHint:
              "The left side shows your original inputs. The right side shows the auto-translated version in the current output language that the model actually used during generation.",
            originalInfo: "Original input",
            localizedInfo: "Auto-translated input",
            translatedProductName: "Product name",
            translatedSellingPoints: "Selling points",
            translatedRestrictions: "Restrictions / banned content",
            translatedSourceDescription: "Additional notes",
            copy: "Copy",
            copied: "Copied",
            sourceImages: "Source images",
            variants: "Variants",
            generated: "Pure image",
            layout: "Layout creative",
            compare: "Compare results",
            addCompare: "Add to compare",
            removeCompare: "Remove",
            clearCompare: "Clear compare",
            compareHint: "Compare up to 4 outputs at once and pick the best candidate faster.",
            comparePickMore: "Pick one more result to enter compare view.",
            shortlisted: "Shortlist",
            approved: "Approve",
            rejected: "Reject",
            resetReview: "Reset",
            prompt: "Optimized prompt",
            download: "Download",
            downloadApproved: "Download approved ZIP",
            approvedSummary: "{count} approved variants are ready for batch download.",
            noApproved: "No approved variants yet. Mark a few results first.",
            rerun: "Run again",
            error: "Retry failed",
            separator: " · ",
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
      ]
        .filter((row) => Boolean(row.originalValue.trim()) || Boolean(row.localizedValue.trim()))
    : [];

  async function handleCopy(fieldId: string, value: string) {
    try {
      await copyToClipboard(value || "-");
      setCopiedFieldId(fieldId);
    } catch {
      setErrorMessage(text.error);
    }
  }

  async function handleRetry() {
    setErrorMessage("");
    const response = await fetch(`/api/jobs/${details.job.id}/retry`, { method: "POST" });
    if (!response.ok) {
      setErrorMessage(text.error);
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

  const comparableItems = details.items.filter((item) => item.generatedAsset);
  const comparedItems = comparableItems.filter((item) => compareIds.includes(item.id));
  const approvedItems = details.items.filter(
    (item) => item.reviewStatus === "approved" && (item.generatedAsset || item.layoutAsset),
  );
  const approvedSummaryText =
    approvedItems.length > 0
      ? text.approvedSummary.replace("{count}", String(approvedItems.length))
      : text.noApproved;

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

      <section className="panel">
        <h3>{text.variants}</h3>
        <div className="variant-list">
          {details.items.map((item) => (
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

              <div className="variant-actions">
                <button
                  className="ghost-button mini-button"
                  onClick={() => handleReviewUpdate(item.id, "shortlisted")}
                  type="button"
                >
                  {text.shortlisted}
                </button>
                <button
                  className="ghost-button mini-button"
                  onClick={() => handleReviewUpdate(item.id, "approved")}
                  type="button"
                >
                  {text.approved}
                </button>
                <button
                  className="ghost-button mini-button danger-button"
                  onClick={() => handleReviewUpdate(item.id, "rejected")}
                  type="button"
                >
                  {text.rejected}
                </button>
                <button
                  className="ghost-button mini-button"
                  onClick={() => handleReviewUpdate(item.id, "unreviewed")}
                  type="button"
                >
                  {text.resetReview}
                </button>
              </div>

              {item.copy ? (
                <div className="copy-panel">
                  <strong>{item.copy.title}</strong>
                  <p>{item.copy.subtitle}</p>
                  <ul>
                    {item.copy.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                  <p className="helper">
                    {text.prompt}: {item.promptText}
                  </p>
                </div>
              ) : item.errorMessage ? (
                <p className="error-text">{item.errorMessage}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
