"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { JobDetails, UiLanguage } from "@/lib/types";

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

function assetPreviewUrl(assetId: string) {
  return `/api/assets/${assetId}`;
}

function assetDownloadUrl(assetId: string) {
  return `/api/assets/${assetId}?download=1`;
}

export function JobDetailsClient({ initialDetails, language }: { initialDetails: JobDetails; language: UiLanguage }) {
  const router = useRouter();
  const [details, setDetails] = useState(initialDetails);
  const [errorMessage, setErrorMessage] = useState("");

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

  const text = useMemo(
    () =>
      language === "zh"
        ? {
            heading: "任务详情",
            sourceImages: "原图",
            variants: "变体结果",
            generated: "纯图片",
            layout: "文案图",
            prompt: "优化提示词",
            download: "下载",
            rerun: "再次生成",
            error: "重试失败",
          }
        : {
            heading: "Job details",
            sourceImages: "Source images",
            variants: "Variants",
            generated: "Pure image",
            layout: "Layout creative",
            prompt: "Optimized prompt",
            download: "Download",
            rerun: "Run again",
            error: "Retry failed",
          },
    [language],
  );

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

  return (
    <div className="stack gap-24">
      <section className="panel split-header">
        <div>
          <p className="eyebrow">{text.heading}</p>
          <h2>{details.job.productName}</h2>
          <p className="helper">
            {details.job.platform} · {details.job.language} · {statusText(language, details.job.status)}
          </p>
        </div>
        <button className="ghost-button" onClick={handleRetry} type="button">
          {text.rerun}
        </button>
      </section>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

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
              <header>
                <div>
                  <h4>
                    {item.imageType} · {item.ratio} · {item.resolutionLabel} · #{item.variantIndex}
                  </h4>
                  <p className="helper">{statusText(language, item.status)}</p>
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
