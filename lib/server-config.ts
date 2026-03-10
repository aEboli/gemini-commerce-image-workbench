import path from "node:path";

import { APP_NAME } from "@/lib/constants";
import type { AppSettings } from "@/lib/types";

export { APP_NAME };

export const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");
export const DEFAULT_STORAGE_DIR = path.join(DEFAULT_DATA_DIR, "assets");
export const DEFAULT_DATABASE_PATH = path.join(DEFAULT_DATA_DIR, "commerce-image-studio.sqlite");
export const DEFAULT_FEISHU_FIELD_MAPPING = JSON.stringify(
  {
    title: "标题",
    image: "生成图片",
    prompt: "提示词",
    negativePrompt: "负向提示词",
    status: "状态",
    mode: "创作模式",
    platform: "平台",
    country: "国家",
    language: "语言",
    ratio: "比例",
    resolution: "分辨率",
    requestedSize: "请求尺寸",
    actualSize: "实际尺寸",
    jobId: "任务ID",
    itemId: "变体ID",
    createdAt: "生成时间",
  },
  null,
  2,
);

export const DEFAULT_SETTINGS: AppSettings = {
  defaultApiKey: "",
  defaultTextModel: "gemini-2.5-flash",
  defaultImageModel: "gemini-2.5-flash-image",
  defaultApiBaseUrl: "",
  defaultApiVersion: "v1beta",
  defaultApiHeaders: "",
  storageDir: DEFAULT_STORAGE_DIR,
  maxConcurrency: 2,
  defaultUiLanguage: "zh",
  feishuSyncEnabled: false,
  feishuAppId: "",
  feishuAppSecret: "",
  feishuBitableAppToken: "",
  feishuBitableTableId: "",
  feishuUploadParentType: "bitable_image",
  feishuFieldMappingJson: DEFAULT_FEISHU_FIELD_MAPPING,
};
