export type UiLanguage = "zh" | "en";

export type JobStatus = "queued" | "processing" | "completed" | "failed" | "partial";

export type JobItemStatus = "queued" | "processing" | "completed" | "failed";

export type JobItemReviewStatus = "unreviewed" | "shortlisted" | "approved" | "rejected";

export type CreationMode = "standard" | "reference-remix" | "prompt";
export type ReferenceStrength = "reference" | "balanced" | "product";

export type ImageType =
  | "scene"
  | "white-background"
  | "model"
  | "poster"
  | "detail"
  | "pain-point";

export interface SelectOption {
  value: string;
  label: Record<UiLanguage, string>;
  description?: Record<UiLanguage, string>;
}

export interface AppSettings {
  defaultApiKey: string;
  defaultTextModel: string;
  defaultImageModel: string;
  defaultApiBaseUrl: string;
  defaultApiVersion: string;
  defaultApiHeaders: string;
  storageDir: string;
  maxConcurrency: number;
  defaultUiLanguage: UiLanguage;
  feishuSyncEnabled: boolean;
  feishuAppId: string;
  feishuAppSecret: string;
  feishuBitableAppToken: string;
  feishuBitableTableId: string;
  feishuUploadParentType: string;
  feishuFieldMappingJson: string;
}

export interface FeishuFieldMapping {
  title?: string;
  image?: string;
  prompt?: string;
  negativePrompt?: string;
  status?: string;
  mode?: string;
  platform?: string;
  country?: string;
  language?: string;
  ratio?: string;
  resolution?: string;
  requestedSize?: string;
  actualSize?: string;
  jobId?: string;
  itemId?: string;
  createdAt?: string;
}

export interface ProviderOverride {
  apiKey?: string;
  apiBaseUrl?: string;
  apiVersion?: string;
  apiHeaders?: string;
}

export interface LocalizedCreativeInputs {
  productName: string;
  sellingPoints: string;
  restrictions: string;
  sourceDescription: string;
}

export interface ReferenceTextZone {
  present: boolean;
  placement: string;
  style: string;
  sourceText: string;
}

export interface ReferenceCalloutZone {
  placement: string;
  style: string;
  sourceText: string;
  iconHint: string;
}

export interface ReferenceLayoutAnalysis {
  summary: string;
  posterStyle: string;
  backgroundType: string;
  primaryProductPlacement: string;
  packagingPresent: boolean;
  packagingPlacement: string;
  productPackagingRelationship: string;
  supportingProps: string[];
  palette: string[];
  cameraAngle: string;
  depthAndLighting: string;
  topBanner: ReferenceTextZone;
  headline: ReferenceTextZone;
  subheadline: ReferenceTextZone;
  bottomBanner: ReferenceTextZone;
  callouts: ReferenceCalloutZone[];
}

export interface ReferencePosterCopy {
  summary: string;
  topBanner: string;
  headline: string;
  subheadline: string;
  bottomBanner: string;
  callouts: string[];
}

export interface ProviderDebugInfo {
  retrievalMethod?: "inline" | "url";
  imageUrl?: string;
  rawText?: string;
  failureStage?: "response" | "provider-image-download";
  failureReason?: string;
  requestedWidth?: number;
  requestedHeight?: number;
  actualWidth?: number;
  actualHeight?: number;
}

export interface JobRecord {
  id: string;
  status: JobStatus;
  creationMode: CreationMode;
  referenceStrength: ReferenceStrength;
  preserveReferenceText: boolean;
  productName: string;
  sku: string;
  category: string;
  brandName: string;
  sellingPoints: string;
  restrictions: string;
  customPrompt: string;
  customNegativePrompt: string;
  autoOptimizePrompt: boolean;
  referenceExtraPrompt: string;
  referenceNegativePrompt: string;
  country: string;
  language: string;
  platform: string;
  selectedTypes: string[];
  selectedRatios: string[];
  selectedResolutions: string[];
  variantsPerType: number;
  includeCopyLayout: boolean;
  batchFileCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  sourceDescription: string;
  uiLanguage: UiLanguage;
  selectedTemplateOverrides: Record<string, string>;
  localizedInputs: LocalizedCreativeInputs | null;
  referenceLayoutOverride: ReferenceLayoutAnalysis | null;
  referencePosterCopyOverride: ReferencePosterCopy | null;
  referenceLayoutAnalysis: ReferenceLayoutAnalysis | null;
  referencePosterCopy: ReferencePosterCopy | null;
}

export interface JobItemRecord {
  id: string;
  jobId: string;
  sourceAssetId: string;
  sourceAssetName: string;
  imageType: ImageType;
  ratio: string;
  resolutionLabel: string;
  width: number;
  height: number;
  variantIndex: number;
  status: JobItemStatus;
  promptText: string | null;
  negativePrompt: string | null;
  copyJson: string | null;
  generatedAssetId: string | null;
  layoutAssetId: string | null;
  reviewStatus: JobItemReviewStatus;
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
  warningMessage: string | null;
  providerDebug: ProviderDebugInfo | null;
}

export interface AssetRecord {
  id: string;
  jobId: string;
  jobItemId: string | null;
  kind: "source" | "reference" | "generated" | "layout";
  originalName: string;
  mimeType: string;
  filePath: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
}

export interface TemplateRecord {
  id: string;
  name: string;
  country: string;
  language: string;
  platform: string;
  category: string;
  imageType: string;
  promptTemplate: string;
  copyTemplate: string;
  layoutStyle: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFilters {
  search?: string;
  country?: string;
  language?: string;
  platform?: string;
  category?: string;
  imageType?: string;
  source?: "all" | "default" | "custom";
}

export interface TemplateInput {
  name: string;
  country: string;
  language: string;
  platform: string;
  category: string;
  imageType: string;
  promptTemplate: string;
  copyTemplate: string;
  layoutStyle: string;
  isDefault?: boolean;
}

export interface BrandRecord {
  id: string;
  name: string;
  primaryColor: string;
  tone: string;
  bannedTerms: string;
  promptGuidance: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandInput {
  name: string;
  primaryColor: string;
  tone: string;
  bannedTerms: string;
  promptGuidance: string;
}

export interface GeneratedCopyBundle {
  optimizedPrompt: string;
  title: string;
  subtitle: string;
  highlights: string[];
  detailAngles: string[];
  painPoints: string[];
  cta: string;
  posterHeadline: string;
  posterSubline: string;
}

export interface JobDetails {
  job: JobRecord;
  sourceAssets: AssetRecord[];
  referenceAssets: AssetRecord[];
  items: Array<
    JobItemRecord & {
      generatedAsset: AssetRecord | null;
      layoutAsset: AssetRecord | null;
      copy: GeneratedCopyBundle | null;
    }
  >;
}
