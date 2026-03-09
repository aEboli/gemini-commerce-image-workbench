"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  ASPECT_RATIOS,
  COUNTRIES,
  getDefaultLanguageForCountry,
  IMAGE_TYPE_OPTIONS,
  OUTPUT_LANGUAGES,
  PLATFORMS,
  PRODUCT_CATEGORIES,
  RESOLUTIONS,
} from "@/lib/constants";
import { getRecommendedCreateDefaults } from "@/lib/recommendations";
import type { BrandRecord, TemplateRecord, UiLanguage } from "@/lib/types";

interface TemplateMatchPreview {
  imageType: string;
  template: TemplateRecord | null;
  candidates: TemplateRecord[];
}

const CREATE_JOB_DRAFT_KEY = "commerce-image-studio.create-draft.v1";
const INITIAL_SELECTED_TYPES = ["scene", "detail", "pain-point"];
const INITIAL_SELECTED_RATIOS = ["1:1"];
const INITIAL_SELECTED_RESOLUTIONS = ["1K"];
const INITIAL_OPEN_SECTIONS = {
  base: true,
  market: true,
  advanced: false,
};
const INITIAL_PAYLOAD = {
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
  temporaryApiBaseUrl: "",
  temporaryApiVersion: "",
  temporaryApiHeaders: "",
};

function copyFor(language: UiLanguage) {
  return language === "zh"
    ? {
        sourceImages: "商品原图",
        livePreview: "实时预览",
        livePreviewEmpty: "上传商品图后，这里会实时显示预览。",
        previousImage: "上一张",
        nextImage: "下一张",
        keyboardHint: "支持键盘左右方向键切换图片。",
        expandSection: "展开",
        collapseSection: "收起",
        imageCounter: "第 {current} / {total} 张",
        baseInfo: "基础信息",
        market: "目标市场",
        generation: "生成参数",
        advanced: "高级选项",
        templatePreview: "本次模板命中预览",
        templatePreviewHint: "系统会按国家、语言、平台、品类和图片类型自动匹配最具体的模板。",
        templateLoading: "正在计算模板命中...",
        templateDefault: "默认模板",
        templateCustom: "自定义模板",
        templateAuto: "自动匹配",
        templateManual: "手动指定",
        chooseTemplate: "自选模板",
        clearTemplateChoice: "恢复匹配",
        templatePickerLabel: "当前图片类型模板",
        templateFallback: "未命中模板，将回退到内置默认策略。",
        wildcard: "全部适用",
        productName: "商品名",
        sku: "SKU",
        brandName: "品牌名",
        category: "品类",
        sellingPoints: "核心卖点",
        restrictions: "限制词 / 禁用内容",
        sourceDescription: "补充说明",
        country: "国家",
        autoLanguageToggle: "跟随国家自动切换语言",
        autoLanguageHint: "开启后，切换国家时会自动带出该市场默认语言。",
        outputLanguage: "输出语言",
        outputLanguageHint: "生成前会自动把商品名、卖点、限制词和补充说明翻译成当前输出语言，再用于出图和文案生成。",
        platform: "平台",
        brandLibraryHint: "可直接输入品牌名，也可从品牌库中选择。",
        imageTypes: "图片类型",
        ratios: "比例",
        resolutions: "分辨率",
        variants: "每种类型生成数量",
        includeLayout: "同时生成文案排版图",
        applyRecommendation: "一键推荐参数",
        recommendationApplied: "已应用推荐参数",
        clearDraft: "清空已填信息",
        clearBaseInfo: "清空基础信息",
        clearAdvancedInfo: "清空临时配置",
        leavePrompt: "当前有未提交的创作草稿，离开页面后本次上传的图片需要重新选择。确认离开吗？",
        submitSuccessTitle: "任务已创建成功",
        submitSuccessHint: "你可以继续创建下一条商品任务，或立即查看本次结果页。",
        continueCreate: "继续创建下一条",
        viewResults: "查看结果页",
        temporaryApiKey: "临时 API Key（可选）",
        temporaryApiBaseUrl: "临时中转 Base URL（可选）",
        temporaryApiVersion: "临时 API 版本（可选）",
        temporaryApiHeaders: "临时请求头 JSON（可选）",
        temporaryRelayHint: "填写这些字段后，本次任务会优先使用临时中转配置，不影响系统默认设置。",
        submit: "提交任务",
        submitting: "提交中...",
        hint: "一次任务会按：图片 × 类型 × 比例 × 分辨率 × 数量 组合生成。",
        filesRequired: "请至少上传一张商品图。",
        generateError: "提交失败，请检查表单和 API Key。",
        baseSummaryEmpty: "填写商品信息、卖点与限制词。",
        advancedSummaryEmpty: "可选的临时密钥与额外配置。",
        temporaryApiKeySet: "已填写临时 API / 中转配置",
        typesUnit: "类图",
        ratiosUnit: "种比例",
        resolutionsUnit: "种分辨率",
      }
    : {
        sourceImages: "Source images",
        livePreview: "Live preview",
        livePreviewEmpty: "Upload product images and the live preview will appear here.",
        previousImage: "Previous image",
        nextImage: "Next image",
        keyboardHint: "Use keyboard left and right arrows to switch images.",
        expandSection: "Expand",
        collapseSection: "Collapse",
        imageCounter: "Image {current} / {total}",
        baseInfo: "Base info",
        market: "Target market",
        generation: "Generation settings",
        advanced: "Advanced",
        templatePreview: "Template match preview",
        templatePreviewHint: "The system matches the most specific template by country, language, platform, category, and image type.",
        templateLoading: "Calculating template matches...",
        templateDefault: "Default template",
        templateCustom: "Custom template",
        templateAuto: "Auto match",
        templateManual: "Manual override",
        chooseTemplate: "Choose template",
        clearTemplateChoice: "Back to match",
        templatePickerLabel: "Template for this image type",
        templateFallback: "No template matched. The system will fall back to the built-in default guidance.",
        wildcard: "Applies to all",
        productName: "Product name",
        sku: "SKU",
        brandName: "Brand",
        category: "Category",
        sellingPoints: "Selling points",
        restrictions: "Restrictions / banned content",
        sourceDescription: "Additional notes",
        country: "Country",
        autoLanguageToggle: "Follow country for language",
        autoLanguageHint: "When enabled, changing country will automatically switch to that market's default language.",
        outputLanguage: "Output language",
        outputLanguageHint: "Before generation, product name, selling points, restrictions, and notes are auto-translated into the current output language.",
        platform: "Platform",
        brandLibraryHint: "Type a brand freely or pick one from the brand library.",
        imageTypes: "Image types",
        ratios: "Aspect ratios",
        resolutions: "Resolutions",
        variants: "Variants per type",
        includeLayout: "Generate layout creative too",
        applyRecommendation: "Recommend setup",
        recommendationApplied: "Recommendation applied",
        clearDraft: "Clear draft",
        clearBaseInfo: "Clear base info",
        clearAdvancedInfo: "Clear temporary config",
        leavePrompt: "You have an unsubmitted draft. If you leave now, the uploaded images must be selected again. Leave this page?",
        submitSuccessTitle: "Job created successfully",
        submitSuccessHint: "You can keep creating the next product or jump straight to the result page.",
        continueCreate: "Create next",
        viewResults: "View result",
        temporaryApiKey: "Temporary API key (optional)",
        temporaryApiBaseUrl: "Temporary relay base URL (optional)",
        temporaryApiVersion: "Temporary API version (optional)",
        temporaryApiHeaders: "Temporary headers JSON (optional)",
        temporaryRelayHint: "When filled, this job will use the temporary relay config first without changing global settings.",
        submit: "Create job",
        submitting: "Submitting...",
        hint: "Each job expands as: images × types × ratios × resolutions × quantity.",
        filesRequired: "Upload at least one product image.",
        generateError: "Submit failed. Check the form and API key.",
        baseSummaryEmpty: "Fill in product details, selling points, and restrictions.",
        advancedSummaryEmpty: "Optional temporary key and extra configuration.",
        temporaryApiKeySet: "Temporary API / relay override added",
        typesUnit: "types",
        ratiosUnit: "ratios",
        resolutionsUnit: "resolutions",
      };
}

function labelFor(value: string, language: UiLanguage, options: Array<{ value: string; label: Record<UiLanguage, string> }>) {
  if (value === "*") {
    return copyFor(language).wildcard;
  }
  return options.find((option) => option.value === value)?.label[language] ?? value;
}

export function CreateJobForm({ language }: { language: UiLanguage }) {
  const router = useRouter();
  const text = useMemo(() => copyFor(language), [language]);
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(INITIAL_SELECTED_TYPES);
  const [selectedRatios, setSelectedRatios] = useState<string[]>(INITIAL_SELECTED_RATIOS);
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>(INITIAL_SELECTED_RESOLUTIONS);
  const [templateMatches, setTemplateMatches] = useState<TemplateMatchPreview[]>([]);
  const [selectedTemplateOverrides, setSelectedTemplateOverrides] = useState<Record<string, string>>({});
  const [templatePickerOpen, setTemplatePickerOpen] = useState<Record<string, boolean>>({});
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [recommendationMessage, setRecommendationMessage] = useState("");
  const [autoLanguageByCountry, setAutoLanguageByCountry] = useState(true);
  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [openSections, setOpenSections] = useState(INITIAL_OPEN_SECTIONS);
  const [payload, setPayload] = useState(INITIAL_PAYLOAD);
  const [draftReady, setDraftReady] = useState(false);
  const [submittedJobId, setSubmittedJobId] = useState<string | null>(null);
  const allowLeaveRef = useRef(false);
  const productNameInputRef = useRef<HTMLInputElement | null>(null);

  const hasDraftChanges = useMemo(() => {
    const payloadChanged = JSON.stringify(payload) !== JSON.stringify(INITIAL_PAYLOAD);
    const typesChanged = JSON.stringify(selectedTypes) !== JSON.stringify(INITIAL_SELECTED_TYPES);
    const ratiosChanged = JSON.stringify(selectedRatios) !== JSON.stringify(INITIAL_SELECTED_RATIOS);
    const resolutionsChanged = JSON.stringify(selectedResolutions) !== JSON.stringify(INITIAL_SELECTED_RESOLUTIONS);
    const hasTemplateOverride = Object.keys(selectedTemplateOverrides).length > 0;
    const hasImages = files.length > 0;

    return payloadChanged || typesChanged || ratiosChanged || resolutionsChanged || hasTemplateOverride || hasImages;
  }, [files.length, payload, selectedRatios, selectedResolutions, selectedTemplateOverrides, selectedTypes]);
  const shouldWarnBeforeLeave = hasDraftChanges && !submittedJobId;

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(CREATE_JOB_DRAFT_KEY);
      if (!rawDraft) {
        setDraftReady(true);
        return;
      }

      const draft = JSON.parse(rawDraft) as {
        payload?: typeof INITIAL_PAYLOAD;
        selectedTypes?: string[];
        selectedRatios?: string[];
        selectedResolutions?: string[];
        selectedTemplateOverrides?: Record<string, string>;
        autoLanguageByCountry?: boolean;
        openSections?: typeof INITIAL_OPEN_SECTIONS;
        recommendationMessage?: string;
      };

      if (draft.payload) {
        setPayload((current) => ({ ...current, ...draft.payload }));
      }
      if (draft.selectedTypes?.length) {
        setSelectedTypes(draft.selectedTypes);
      }
      if (draft.selectedRatios?.length) {
        setSelectedRatios([draft.selectedRatios[0]]);
      }
      if (draft.selectedResolutions?.length) {
        setSelectedResolutions([draft.selectedResolutions[0]]);
      }
      if (draft.selectedTemplateOverrides) {
        setSelectedTemplateOverrides(draft.selectedTemplateOverrides);
      }
      if (typeof draft.autoLanguageByCountry === "boolean") {
        setAutoLanguageByCountry(draft.autoLanguageByCountry);
      }
      if (draft.openSections) {
        setOpenSections((current) => ({ ...current, ...draft.openSections }));
      }
      if (draft.recommendationMessage) {
        setRecommendationMessage(draft.recommendationMessage);
      }
    } catch {
      window.localStorage.removeItem(CREATE_JOB_DRAFT_KEY);
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) {
      return;
    }

    window.localStorage.setItem(
      CREATE_JOB_DRAFT_KEY,
      JSON.stringify({
        payload,
        selectedTypes,
        selectedRatios,
        selectedResolutions,
        selectedTemplateOverrides,
        autoLanguageByCountry,
        openSections,
        recommendationMessage,
      }),
    );
  }, [
    autoLanguageByCountry,
    draftReady,
    openSections,
    payload,
    recommendationMessage,
    selectedRatios,
    selectedResolutions,
    selectedTemplateOverrides,
    selectedTypes,
  ]);

  useEffect(() => {
    if (!draftReady || !shouldWarnBeforeLeave) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowLeaveRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = text.leavePrompt;
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (allowLeaveRef.current) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (nextUrl.href === currentUrl.href) {
        return;
      }

      const confirmed = window.confirm(text.leavePrompt);
      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        return;
      }

      allowLeaveRef.current = true;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [draftReady, shouldWarnBeforeLeave, text.leavePrompt]);

  useEffect(() => {
    let cancelled = false;

    async function loadBrands() {
      const response = await fetch("/api/brands");
      if (!response.ok) {
        return;
      }
      const body = (await response.json()) as { brands?: BrandRecord[] };
      if (!cancelled) {
        setBrands(body.brands ?? []);
      }
    }

    loadBrands();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!files.length) {
      setPreviewUrls([]);
      setPreviewIndex(0);
      return;
    }

    const objectUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(objectUrls);
    setPreviewIndex((current) => Math.min(current, objectUrls.length - 1));

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  useEffect(() => {
    if (previewUrls.length <= 1) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isEditable = target?.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";

      if (isEditable) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPreviewIndex((current) => (current === 0 ? previewUrls.length - 1 : current - 1));
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPreviewIndex((current) => (current === previewUrls.length - 1 ? 0 : current + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewUrls.length]);

  useEffect(() => {
    setSelectedTemplateOverrides((current) =>
      Object.fromEntries(Object.entries(current).filter(([imageType]) => selectedTypes.includes(imageType))),
    );
    setTemplatePickerOpen((current) =>
      Object.fromEntries(Object.entries(current).filter(([imageType]) => selectedTypes.includes(imageType))),
    );
  }, [selectedTypes]);

  useEffect(() => {
    if (!selectedTypes.length) {
      setTemplateMatches([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoadingMatches(true);
      try {
        const response = await fetch("/api/templates/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country: payload.country,
            language: payload.language,
            platform: payload.platform,
            category: payload.category,
            imageTypes: selectedTypes,
          }),
        });

        const body = (await response.json().catch(() => null)) as { matches?: TemplateMatchPreview[]; error?: string } | null;

        if (!cancelled) {
          setTemplateMatches(response.ok ? body?.matches ?? [] : []);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMatches(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [payload.country, payload.language, payload.platform, payload.category, selectedTypes]);

  function toggleSelection(value: string, selected: string[], setter: (items: string[]) => void) {
    if (selected.includes(value)) {
      setter(selected.filter((item) => item !== value));
      return;
    }
    setter([...selected, value]);
  }

  function selectSingle(value: string, setter: (items: string[]) => void) {
    setter([value]);
  }

  function showPreviousPreview() {
    setPreviewIndex((current) => (current === 0 ? previewUrls.length - 1 : current - 1));
  }

  function showNextPreview() {
    setPreviewIndex((current) => (current === previewUrls.length - 1 ? 0 : current + 1));
  }

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function applyRecommendedSetup() {
    const recommendation = getRecommendedCreateDefaults({
      platform: payload.platform,
      category: payload.category,
    });

    setSelectedTypes(recommendation.selectedTypes);
    setSelectedRatios(recommendation.selectedRatios.length ? [recommendation.selectedRatios[0]] : ["1:1"]);
    setSelectedResolutions(recommendation.selectedResolutions.length ? [recommendation.selectedResolutions[0]] : ["1K"]);
    setPayload((current) => ({
      ...current,
      variantsPerType: recommendation.variantsPerType,
      includeCopyLayout: recommendation.includeCopyLayout,
    }));
    setRecommendationMessage(`${text.recommendationApplied} · ${recommendation.reason[language]}`);
  }

  function clearBaseInfo() {
    setPayload((current) => ({
      ...current,
      productName: "",
      sku: "",
      brandName: "",
      sellingPoints: "",
      restrictions: "",
      sourceDescription: "",
    }));
    setRecommendationMessage("");
    setErrorMessage("");
  }

  function clearAdvancedInfo() {
    setPayload((current) => ({
      ...current,
      temporaryApiKey: "",
      temporaryApiBaseUrl: "",
      temporaryApiVersion: "",
      temporaryApiHeaders: "",
    }));
    setErrorMessage("");
  }

  function prepareNextCreate() {
    setFiles([]);
    setPreviewUrls([]);
    setPreviewIndex(0);
    setErrorMessage("");
    setPayload((current) => ({
      ...current,
      productName: "",
      sku: "",
      brandName: "",
      sellingPoints: "",
      restrictions: "",
      sourceDescription: "",
    }));
  }

  function clearDraft() {
    allowLeaveRef.current = true;
    setSubmittedJobId(null);
    setFiles([]);
    setPreviewUrls([]);
    setPreviewIndex(0);
    setSelectedTypes(INITIAL_SELECTED_TYPES);
    setSelectedRatios(INITIAL_SELECTED_RATIOS);
    setSelectedResolutions(INITIAL_SELECTED_RESOLUTIONS);
    setSelectedTemplateOverrides({});
    setTemplatePickerOpen({});
    setRecommendationMessage("");
    setErrorMessage("");
    setAutoLanguageByCountry(true);
    setOpenSections(INITIAL_OPEN_SECTIONS);
    setPayload(INITIAL_PAYLOAD);
    window.localStorage.removeItem(CREATE_JOB_DRAFT_KEY);
    window.setTimeout(() => {
      allowLeaveRef.current = false;
    }, 0);
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
          selectedTemplateOverrides,
          temporaryProvider: {
            apiKey: payload.temporaryApiKey,
            apiBaseUrl: payload.temporaryApiBaseUrl,
            apiVersion: payload.temporaryApiVersion,
            apiHeaders: payload.temporaryApiHeaders,
          },
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
      window.localStorage.removeItem(CREATE_JOB_DRAFT_KEY);
      setSubmittedJobId(body.jobId);
    });
  }

  function handleContinueCreate() {
    setSubmittedJobId(null);
    prepareNextCreate();
    window.setTimeout(() => {
      productNameInputRef.current?.focus();
      productNameInputRef.current?.select();
    }, 0);
  }

  function handleViewResults() {
    if (!submittedJobId) {
      return;
    }

    allowLeaveRef.current = true;
    router.push(`/jobs/${submittedJobId}`);
  }

  function toggleTemplatePicker(imageType: string) {
    setTemplatePickerOpen((current) => ({
      ...current,
      [imageType]: !current[imageType],
    }));
  }

  function applyTemplateOverride(imageType: string, templateId: string) {
    setSelectedTemplateOverrides((current) => {
      if (!templateId) {
        const next = { ...current };
        delete next[imageType];
        return next;
      }

      return {
        ...current,
        [imageType]: templateId,
      };
    });
  }

  const currentPreviewUrl = previewUrls[previewIndex] ?? null;
  const baseSummary = [payload.productName, payload.brandName, labelFor(payload.category, language, PRODUCT_CATEGORIES)].filter(Boolean).join(" · ") || text.baseSummaryEmpty;
  const marketSummary = [
    labelFor(payload.country, language, COUNTRIES),
    labelFor(payload.platform, language, PLATFORMS),
    `${selectedTypes.length} ${text.typesUnit}`,
    selectedRatios[0] ?? "-",
    selectedResolutions[0] ?? "-",
  ].join(" · ");
  const advancedSummary =
    payload.temporaryApiKey || payload.temporaryApiBaseUrl || payload.temporaryApiVersion || payload.temporaryApiHeaders
      ? text.temporaryApiKeySet
      : text.advancedSummaryEmpty;

  return (
    <>
      <form className="create-workspace" onSubmit={handleSubmit}>
        <aside className="create-sidebar">
        <div className="create-sidebar-sticky">
          <section className="panel create-panel">
            <div className="split-header compact">
              <div>
                <h2>{text.sourceImages}</h2>
                {!!files.length && <p className="helper">{files.length} file(s) selected</p>}
              </div>
              {files.length ? (
                <span className="helper">
                  {text.imageCounter.replace("{current}", String(previewIndex + 1)).replace("{total}", String(files.length))}
                </span>
              ) : null}
            </div>
            <input multiple accept="image/*" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} type="file" />
            <div className="split-header compact preview-header-row">
              <h3>{text.livePreview}</h3>
              <span className="helper">{text.keyboardHint}</span>
            </div>
            {currentPreviewUrl ? (
              <>
                <div className="preview-stage">
                  <img alt={files[previewIndex]?.name || text.livePreview} className="preview-stage-image" src={currentPreviewUrl} />
                  {previewUrls.length > 1 ? (
                    <>
                      <button aria-label={text.previousImage} className="preview-arrow preview-arrow-left" onClick={showPreviousPreview} type="button">
                        ‹
                      </button>
                      <button aria-label={text.nextImage} className="preview-arrow preview-arrow-right" onClick={showNextPreview} type="button">
                        ›
                      </button>
                    </>
                  ) : null}
                </div>
                {previewUrls.length > 1 ? (
                  <div className="preview-thumb-row" role="tablist" aria-label={text.livePreview}>
                    {previewUrls.map((url, index) => (
                      <button
                        aria-label={files[index]?.name || `${text.livePreview} ${index + 1}`}
                        className={index === previewIndex ? "preview-thumb is-active" : "preview-thumb"}
                        key={`${files[index]?.name || "image"}-${index}`}
                        onClick={() => setPreviewIndex(index)}
                        type="button"
                      >
                        <img alt={files[index]?.name || text.livePreview} src={url} />
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="preview-stage preview-stage-empty">
                <p className="helper">{text.livePreviewEmpty}</p>
              </div>
            )}
          </section>

          <section className="panel create-panel">
            <div className="split-header compact">
              <div>
                <h3>{text.templatePreview}</h3>
                <p className="helper">{text.templatePreviewHint}</p>
              </div>
              {isLoadingMatches ? <span className="helper">{text.templateLoading}</span> : null}
            </div>
            <div className="template-match-list compact-template-match-list">
              {selectedTypes.map((imageType) => {
                const match = templateMatches.find((item) => item.imageType === imageType);
                const selectedTemplateId = selectedTemplateOverrides[imageType] ?? "";
                const displayTemplate = selectedTemplateId
                  ? match?.candidates.find((candidate) => candidate.id === selectedTemplateId) ?? match?.template ?? null
                  : match?.template ?? null;
                const typeLabel = labelFor(imageType, language, IMAGE_TYPE_OPTIONS);
                return (
                  <article className="template-match-card" key={imageType}>
                    <div className="template-match-header">
                      <strong>{typeLabel}</strong>
                      {displayTemplate ? (
                        <span className={selectedTemplateId ? "template-badge is-custom" : displayTemplate.isDefault ? "template-badge is-default" : "template-badge is-custom"}>
                          {selectedTemplateId ? text.templateManual : displayTemplate.isDefault ? text.templateDefault : text.templateCustom}
                        </span>
                      ) : null}
                    </div>
                    {displayTemplate ? (
                      <>
                        <p className="template-match-name">{displayTemplate.name}</p>
                        <div className="template-match-meta">
                          <span>{labelFor(displayTemplate.country, language, COUNTRIES)}</span>
                          <span>{labelFor(displayTemplate.language, language, OUTPUT_LANGUAGES)}</span>
                          <span>{labelFor(displayTemplate.platform, language, PLATFORMS)}</span>
                          <span>{labelFor(displayTemplate.category, language, PRODUCT_CATEGORIES)}</span>
                        </div>
                        <div className="template-card-actions">
                          <button className="ghost-button mini-button" onClick={() => toggleTemplatePicker(imageType)} type="button">
                            {text.chooseTemplate}
                          </button>
                          {selectedTemplateId ? (
                            <button className="ghost-button mini-button" onClick={() => applyTemplateOverride(imageType, "")} type="button">
                              {text.clearTemplateChoice}
                            </button>
                          ) : null}
                        </div>
                        {templatePickerOpen[imageType] || selectedTemplateId ? (
                          <label className="template-picker-field">
                            <span>{text.templatePickerLabel}</span>
                            <select value={selectedTemplateId} onChange={(event) => applyTemplateOverride(imageType, event.target.value)}>
                              <option value="">{text.templateAuto}</option>
                              {(match?.candidates ?? []).map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.name} · {labelFor(candidate.platform, language, PLATFORMS)} · {labelFor(candidate.category, language, PRODUCT_CATEGORIES)}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <p className="helper">{text.templateFallback}</p>
                        {(match?.candidates ?? []).length ? (
                          <>
                            <div className="template-card-actions">
                              <button className="ghost-button mini-button" onClick={() => toggleTemplatePicker(imageType)} type="button">
                                {text.chooseTemplate}
                              </button>
                            </div>
                            {templatePickerOpen[imageType] ? (
                              <label className="template-picker-field">
                                <span>{text.templatePickerLabel}</span>
                                <select value={selectedTemplateId} onChange={(event) => applyTemplateOverride(imageType, event.target.value)}>
                                  <option value="">{text.templateAuto}</option>
                                  {(match?.candidates ?? []).map((candidate) => (
                                    <option key={candidate.id} value={candidate.id}>
                                      {candidate.name} · {labelFor(candidate.platform, language, PLATFORMS)} · {labelFor(candidate.category, language, PRODUCT_CATEGORIES)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ) : null}
                          </>
                        ) : null}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
        </aside>

        <div className="create-main stack gap-24">
        <section className="panel create-panel accordion-panel">
          <div className="accordion-header">
            <div className="accordion-title-group">
              <h2>{text.baseInfo}</h2>
              <p className="helper">{baseSummary}</p>
            </div>
            <div className="accordion-actions">
              <button className="ghost-button mini-button" onClick={clearBaseInfo} type="button">
                {text.clearBaseInfo}
              </button>
              <button
                aria-expanded={openSections.base}
                className="accordion-toggle-button"
                onClick={() => toggleSection("base")}
                type="button"
              >
                <span>{openSections.base ? text.collapseSection : text.expandSection}</span>
                <span className={openSections.base ? "accordion-icon is-open" : "accordion-icon"}>⌄</span>
              </button>
            </div>
          </div>
          {openSections.base ? (
            <div className="accordion-body">
              <label>
                <span>{text.productName}</span>
                <input
                  ref={productNameInputRef}
                  required
                  value={payload.productName}
                  onChange={(event) => setPayload({ ...payload, productName: event.target.value })}
                />
              </label>
              <label>
                <span>{text.sku}</span>
                <input value={payload.sku} onChange={(event) => setPayload({ ...payload, sku: event.target.value })} />
              </label>
              <label>
                <span>{text.brandName}</span>
                <input list="brand-library-options" value={payload.brandName} onChange={(event) => setPayload({ ...payload, brandName: event.target.value })} />
                <datalist id="brand-library-options">
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name} />
                  ))}
                </datalist>
                <small className="helper">{text.brandLibraryHint}</small>
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
          ) : null}
        </section>

        <section className="panel create-panel accordion-panel">
          <div className="accordion-header">
            <div className="accordion-title-group">
              <h2>{text.market}</h2>
              <p className="helper">{marketSummary}</p>
            </div>
            <button
              aria-expanded={openSections.market}
              className="accordion-toggle-button"
              onClick={() => toggleSection("market")}
              type="button"
            >
              <span>{openSections.market ? text.collapseSection : text.expandSection}</span>
              <span className={openSections.market ? "accordion-icon is-open" : "accordion-icon"}>⌄</span>
            </button>
          </div>
          {openSections.market ? (
            <div className="accordion-body">
              <label>
                <span>{text.country}</span>
                <select
                  value={payload.country}
                  onChange={(event) => {
                    const country = event.target.value;
                    const nextLanguage = getDefaultLanguageForCountry(country);
                    setPayload({
                      ...payload,
                      country,
                      language: autoLanguageByCountry ? nextLanguage ?? payload.language : payload.language,
                    });
                  }}
                >
                  {COUNTRIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label[language]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-row helper-toggle-row">
                <input
                  checked={autoLanguageByCountry}
                  type="checkbox"
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setAutoLanguageByCountry(checked);
                    if (checked) {
                      const nextLanguage = getDefaultLanguageForCountry(payload.country);
                      if (nextLanguage) {
                        setPayload((current) => ({
                          ...current,
                          language: nextLanguage,
                        }));
                      }
                    }
                  }}
                />
                <span>{text.autoLanguageToggle}</span>
              </label>
              <p className="helper inline-helper">{text.autoLanguageHint}</p>
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
              <p className="helper inline-helper">{text.outputLanguageHint}</p>
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
              <div className="split-header compact generator-header-row">
                <p className="helper">{recommendationMessage || text.hint}</p>
                <button className="ghost-button mini-button" onClick={applyRecommendedSetup} type="button">
                  {text.applyRecommendation}
                </button>
              </div>
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
                      <input checked={selectedRatios.includes(option.value)} onChange={() => selectSingle(option.value, setSelectedRatios)} type="checkbox" />
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
                      <input checked={selectedResolutions.includes(option.value)} onChange={() => selectSingle(option.value, setSelectedResolutions)} type="checkbox" />
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
            </div>
          ) : null}
        </section>

        <section className="panel create-panel accordion-panel">
          <div className="accordion-header">
            <div className="accordion-title-group">
              <h2>{text.advanced}</h2>
              <p className="helper">{advancedSummary}</p>
            </div>
            <div className="accordion-actions">
              <button className="ghost-button mini-button" onClick={clearAdvancedInfo} type="button">
                {text.clearAdvancedInfo}
              </button>
              <button
                aria-expanded={openSections.advanced}
                className="accordion-toggle-button"
                onClick={() => toggleSection("advanced")}
                type="button"
              >
                <span>{openSections.advanced ? text.collapseSection : text.expandSection}</span>
                <span className={openSections.advanced ? "accordion-icon is-open" : "accordion-icon"}>⌄</span>
              </button>
            </div>
          </div>
          {openSections.advanced ? (
            <div className="accordion-body">
              <label>
                <span>{text.temporaryApiKey}</span>
                <input type="password" value={payload.temporaryApiKey} onChange={(event) => setPayload({ ...payload, temporaryApiKey: event.target.value })} />
              </label>
              <label>
                <span>{text.temporaryApiBaseUrl}</span>
                <input
                  placeholder="https://your-relay-host.example"
                  value={payload.temporaryApiBaseUrl}
                  onChange={(event) => setPayload({ ...payload, temporaryApiBaseUrl: event.target.value })}
                />
              </label>
              <label>
                <span>{text.temporaryApiVersion}</span>
                <input value={payload.temporaryApiVersion} onChange={(event) => setPayload({ ...payload, temporaryApiVersion: event.target.value })} />
              </label>
              <label>
                <span>{text.temporaryApiHeaders}</span>
                <textarea
                  rows={4}
                  placeholder='{"Authorization":"Bearer your-key"}'
                  value={payload.temporaryApiHeaders}
                  onChange={(event) => setPayload({ ...payload, temporaryApiHeaders: event.target.value })}
                />
              </label>
              <p className="helper">{text.temporaryRelayHint}</p>
            </div>
          ) : null}
        </section>

        <footer className="panel form-footer create-submit-bar">
          <p className="helper">{text.hint}</p>
          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
          <div className="button-row">
            <button className="ghost-button" onClick={clearDraft} type="button">
              {text.clearDraft}
            </button>
            <button className="primary-button" disabled={isPending} type="submit">
              {isPending ? text.submitting : text.submit}
            </button>
          </div>
        </footer>
        </div>
      </form>

      {submittedJobId ? (
        <div className="success-modal-backdrop" role="presentation">
          <section aria-modal="true" className="success-modal" role="dialog" aria-labelledby="create-success-title">
            <p className="eyebrow success-text">{text.submitSuccessTitle}</p>
            <h3 id="create-success-title">{text.submitSuccessTitle}</h3>
            <p className="helper">{text.submitSuccessHint}</p>
            <div className="button-row success-modal-actions">
              <button className="ghost-button" onClick={handleContinueCreate} type="button">
                {text.continueCreate}
              </button>
              <button className="primary-button" onClick={handleViewResults} type="button">
                {text.viewResults}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
