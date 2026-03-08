import type { ImageType, SelectOption } from "@/lib/types";

export const APP_NAME = "Commerce Image Studio";

export const COUNTRIES: SelectOption[] = [
  { value: "CN", label: { zh: "中国", en: "China" } },
  { value: "US", label: { zh: "美国", en: "United States" } },
  { value: "GB", label: { zh: "英国", en: "United Kingdom" } },
  { value: "DE", label: { zh: "德国", en: "Germany" } },
  { value: "FR", label: { zh: "法国", en: "France" } },
  { value: "JP", label: { zh: "日本", en: "Japan" } },
  { value: "KR", label: { zh: "韩国", en: "South Korea" } },
  { value: "CA", label: { zh: "加拿大", en: "Canada" } },
  { value: "AU", label: { zh: "澳大利亚", en: "Australia" } },
  { value: "SG", label: { zh: "新加坡", en: "Singapore" } },
];

export const OUTPUT_LANGUAGES: SelectOption[] = [
  { value: "zh-CN", label: { zh: "简体中文", en: "Simplified Chinese" } },
  { value: "en-US", label: { zh: "英语（美国）", en: "English (US)" } },
  { value: "en-GB", label: { zh: "英语（英国）", en: "English (UK)" } },
  { value: "de-DE", label: { zh: "德语", en: "German" } },
  { value: "fr-FR", label: { zh: "法语", en: "French" } },
  { value: "ja-JP", label: { zh: "日语", en: "Japanese" } },
  { value: "ko-KR", label: { zh: "韩语", en: "Korean" } },
  { value: "es-ES", label: { zh: "西班牙语", en: "Spanish" } },
  { value: "pt-BR", label: { zh: "葡萄牙语（巴西）", en: "Portuguese (Brazil)" } },
];

export const PLATFORMS: SelectOption[] = [
  { value: "amazon", label: { zh: "Amazon", en: "Amazon" } },
  { value: "tiktok-shop", label: { zh: "TikTok Shop", en: "TikTok Shop" } },
  { value: "taobao", label: { zh: "淘宝", en: "Taobao" } },
  { value: "tmall", label: { zh: "天猫", en: "Tmall" } },
  { value: "jd", label: { zh: "京东", en: "JD.com" } },
  { value: "shopee", label: { zh: "Shopee", en: "Shopee" } },
  { value: "lazada", label: { zh: "Lazada", en: "Lazada" } },
  { value: "ebay", label: { zh: "eBay", en: "eBay" } },
  { value: "etsy", label: { zh: "Etsy", en: "Etsy" } },
  { value: "rakuten", label: { zh: "Rakuten", en: "Rakuten" } },
  { value: "aliexpress", label: { zh: "AliExpress", en: "AliExpress" } },
];

export const PRODUCT_CATEGORIES: SelectOption[] = [
  { value: "fashion", label: { zh: "服饰", en: "Fashion" } },
  { value: "beauty", label: { zh: "美妆", en: "Beauty" } },
  { value: "home", label: { zh: "家居", en: "Home" } },
  { value: "electronics", label: { zh: "3C 数码", en: "Electronics" } },
  { value: "pets", label: { zh: "宠物", en: "Pets" } },
  { value: "baby", label: { zh: "母婴", en: "Baby" } },
  { value: "food", label: { zh: "食品", en: "Food" } },
  { value: "outdoor", label: { zh: "户外", en: "Outdoor" } },
  { value: "jewelry", label: { zh: "珠宝", en: "Jewelry" } },
  { value: "general", label: { zh: "泛品", en: "General" } },
];

export const IMAGE_TYPE_OPTIONS: Array<SelectOption & { value: ImageType }> = [
  {
    value: "scene",
    label: { zh: "场景图", en: "Lifestyle scene" },
    description: { zh: "把商品放进真实使用场景", en: "Place the product in a realistic lifestyle scene" },
  },
  {
    value: "white-background",
    label: { zh: "白底图", en: "White background" },
    description: { zh: "标准 listing 主图", en: "Clean white-background marketplace image" },
  },
  {
    value: "model",
    label: { zh: "模特图", en: "Model image" },
    description: { zh: "适合服饰或佩戴类产品", en: "Model-worn or model-used presentation" },
  },
  {
    value: "poster",
    label: { zh: "海报图", en: "Poster" },
    description: { zh: "强营销视觉和促销感", en: "Poster-style promotional creative" },
  },
  {
    value: "detail",
    label: { zh: "细节图", en: "Detail image" },
    description: { zh: "放大材质、做工和结构", en: "Highlight product materials and craftsmanship" },
  },
  {
    value: "pain-point",
    label: { zh: "痛点图", en: "Pain-point image" },
    description: { zh: "围绕问题与解决方案构图", en: "Sell through pain-point to solution storytelling" },
  },
];

export const ASPECT_RATIOS: SelectOption[] = [
  { value: "1:1", label: { zh: "1:1 方图", en: "1:1 Square" } },
  { value: "4:5", label: { zh: "4:5 竖图", en: "4:5 Portrait" } },
  { value: "3:4", label: { zh: "3:4 竖图", en: "3:4 Portrait" } },
  { value: "16:9", label: { zh: "16:9 横图", en: "16:9 Landscape" } },
  { value: "9:16", label: { zh: "9:16 竖屏", en: "9:16 Vertical" } },
];

export const RESOLUTIONS: SelectOption[] = [
  { value: "512px", label: { zh: "512px", en: "512px" } },
  { value: "1K", label: { zh: "1K", en: "1K" } },
  { value: "2K", label: { zh: "2K", en: "2K" } },
  { value: "4K", label: { zh: "4K", en: "4K" } },
];

export const UI_LANGUAGE_OPTIONS: SelectOption[] = [
  { value: "zh", label: { zh: "中文", en: "中文" } },
  { value: "en", label: { zh: "English", en: "English" } },
];

export const STATUS_COLORS: Record<string, string> = {
  queued: "var(--warning-soft)",
  processing: "var(--info-soft)",
  completed: "var(--success-soft)",
  partial: "var(--warning-soft)",
  failed: "var(--danger-soft)",
};
