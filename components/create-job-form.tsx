"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  ASPECT_RATIOS,
  COUNTRIES,
  IMAGE_TYPE_OPTIONS,
  OUTPUT_LANGUAGES,
  PLATFORMS,
  PRODUCT_CATEGORIES,
  RESOLUTIONS,
} from "@/lib/constants";
import type { UiLanguage } from "@/lib/types";

function copyFor(language: UiLanguage) {
  return language === "zh"
    ? {
        sourceImages: "商品原图",
        baseInfo: "基础信息",
        market: "目标市场",
        generation: "生成参数",
        advanced: "高级选项",
        productName: "商品名",
        sku: "SKU",
        brandName: "品牌名",
        category: "品类",
        sellingPoints: "核心卖点",
        restrictions: "限制词 / 禁用内容",
        sourceDescription: "补充说明",
        country: "国家",
        outputLanguage: "输出语言",
        platform: "平台",
        imageTypes: "图片类型",
        ratios: "比例",
        resolutions: "分辨率",
        variants: "每种类型生成数量",
        includeLayout: "同时生成文案排版图",
        temporaryApiKey: "临时 API Key（可选）",
        submit: "提交任务",
        submitting: "提交中...",
        hint: "一次任务会按：图片 × 类型 × 比例 × 分辨率 × 数量 组合生成。",
        filesRequired: "请至少上传一张商品图。",
        generateError: "提交失败，请检查表单和 API Key。",
      }
    : {
        sourceImages: "Source images",
        baseInfo: "Base info",
        market: "Target market",
        generation: "Generation settings",
        advanced: "Advanced",
        productName: "Product name",
        sku: "SKU",
        brandName: "Brand",
        category: "Category",
        sellingPoints: "Selling points",
        restrictions: "Restrictions / banned content",
        sourceDescription: "Additional notes",
        country: "Country",
        outputLanguage: "Output language",
        platform: "Platform",
        imageTypes: "Image types",
        ratios: "Aspect ratios",
        resolutions: "Resolutions",
        variants: "Variants per type",
        includeLayout: "Generate layout creative too",
        temporaryApiKey: "Temporary API key (optional)",
        submit: "Create job",
        submitting: "Submitting...",
        hint: "Each job expands as: images × types × ratios × resolutions × quantity.",
        filesRequired: "Upload at least one product image.",
        generateError: "Submit failed. Check the form and API key.",
      };
}

export function CreateJobForm({ language }: { language: UiLanguage }) {
  const router = useRouter();
  const text = useMemo(() => copyFor(language), [language]);
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["scene", "detail", "pain-point"]);
  const [selectedRatios, setSelectedRatios] = useState<string[]>(["1:1", "4:5"]);
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>(["1K"]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [payload, setPayload] = useState({
    productName: "",
    sku: "",
    brandName: "",
    category: "general",
    sellingPoints: "",
    restrictions: "",
    sourceDescription: "",
    country: "US",
    language: "en-US",
    platform: "amazon",
    variantsPerType: 1,
    includeCopyLayout: true,
    temporaryApiKey: "",
  });

  function toggleSelection(value: string, selected: string[], setter: (items: string[]) => void) {
    if (selected.includes(value)) {
      setter(selected.filter((item) => item !== value));
      return;
    }
    setter([...selected, value]);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!files.length) {
      setErrorMessage(text.filesRequired);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      formData.append(
        "payload",
        JSON.stringify({
          ...payload,
          selectedTypes,
          selectedRatios,
          selectedResolutions,
          uiLanguage: language,
        }),
      );

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorMessage(body?.error ?? text.generateError);
        return;
      }

      const body = (await response.json()) as { jobId: string };
      router.push(`/jobs/${body.jobId}`);
    });
  }

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <section>
        <h2>{text.sourceImages}</h2>
        <input multiple accept="image/*" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} type="file" />
        {!!files.length && <p className="helper">{files.length} file(s) selected</p>}
      </section>

      <section className="grid two">
        <div>
          <h2>{text.baseInfo}</h2>
          <label>
            <span>{text.productName}</span>
            <input required value={payload.productName} onChange={(event) => setPayload({ ...payload, productName: event.target.value })} />
          </label>
          <label>
            <span>{text.sku}</span>
            <input value={payload.sku} onChange={(event) => setPayload({ ...payload, sku: event.target.value })} />
          </label>
          <label>
            <span>{text.brandName}</span>
            <input value={payload.brandName} onChange={(event) => setPayload({ ...payload, brandName: event.target.value })} />
          </label>
          <label>
            <span>{text.category}</span>
            <select value={payload.category} onChange={(event) => setPayload({ ...payload, category: event.target.value })}>
              {PRODUCT_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label[language]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{text.sellingPoints}</span>
            <textarea rows={4} value={payload.sellingPoints} onChange={(event) => setPayload({ ...payload, sellingPoints: event.target.value })} />
          </label>
          <label>
            <span>{text.restrictions}</span>
            <textarea rows={3} value={payload.restrictions} onChange={(event) => setPayload({ ...payload, restrictions: event.target.value })} />
          </label>
          <label>
            <span>{text.sourceDescription}</span>
            <textarea rows={3} value={payload.sourceDescription} onChange={(event) => setPayload({ ...payload, sourceDescription: event.target.value })} />
          </label>
        </div>

        <div>
          <h2>{text.market}</h2>
          <label>
            <span>{text.country}</span>
            <select value={payload.country} onChange={(event) => setPayload({ ...payload, country: event.target.value })}>
              {COUNTRIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label[language]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{text.outputLanguage}</span>
            <select value={payload.language} onChange={(event) => setPayload({ ...payload, language: event.target.value })}>
              {OUTPUT_LANGUAGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label[language]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{text.platform}</span>
            <select value={payload.platform} onChange={(event) => setPayload({ ...payload, platform: event.target.value })}>
              {PLATFORMS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label[language]}
                </option>
              ))}
            </select>
          </label>

          <h2>{text.generation}</h2>
          <fieldset>
            <legend>{text.imageTypes}</legend>
            <div className="chip-grid">
              {IMAGE_TYPE_OPTIONS.map((option) => (
                <label className={selectedTypes.includes(option.value) ? "chip is-active" : "chip"} key={option.value}>
                  <input checked={selectedTypes.includes(option.value)} onChange={() => toggleSelection(option.value, selectedTypes, setSelectedTypes)} type="checkbox" />
                  <span>{option.label[language]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>{text.ratios}</legend>
            <div className="chip-grid small">
              {ASPECT_RATIOS.map((option) => (
                <label className={selectedRatios.includes(option.value) ? "chip is-active" : "chip"} key={option.value}>
                  <input checked={selectedRatios.includes(option.value)} onChange={() => toggleSelection(option.value, selectedRatios, setSelectedRatios)} type="checkbox" />
                  <span>{option.label[language]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>{text.resolutions}</legend>
            <div className="chip-grid small">
              {RESOLUTIONS.map((option) => (
                <label className={selectedResolutions.includes(option.value) ? "chip is-active" : "chip"} key={option.value}>
                  <input checked={selectedResolutions.includes(option.value)} onChange={() => toggleSelection(option.value, selectedResolutions, setSelectedResolutions)} type="checkbox" />
                  <span>{option.label[language]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            <span>{text.variants}</span>
            <input min={1} max={6} type="number" value={payload.variantsPerType} onChange={(event) => setPayload({ ...payload, variantsPerType: Number(event.target.value) || 1 })} />
          </label>
          <label className="checkbox-row">
            <input checked={payload.includeCopyLayout} type="checkbox" onChange={(event) => setPayload({ ...payload, includeCopyLayout: event.target.checked })} />
            <span>{text.includeLayout}</span>
          </label>

          <h2>{text.advanced}</h2>
          <label>
            <span>{text.temporaryApiKey}</span>
            <input type="password" value={payload.temporaryApiKey} onChange={(event) => setPayload({ ...payload, temporaryApiKey: event.target.value })} />
          </label>
        </div>
      </section>

      <footer className="form-footer">
        <p className="helper">{text.hint}</p>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? text.submitting : text.submit}
        </button>
      </footer>
    </form>
  );
}
