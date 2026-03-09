import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { DEFAULT_DATABASE_PATH, DEFAULT_SETTINGS } from "@/lib/server-config";
import { getTemplateSeedData } from "@/lib/templates";
import type {
  AppSettings,
  AssetRecord,
  BrandInput,
  BrandRecord,
  GeneratedCopyBundle,
  JobDetails,
  JobItemRecord,
  JobItemReviewStatus,
  JobRecord,
  JobStatus,
  LocalizedCreativeInputs,
  TemplateFilters,
  TemplateInput,
  TemplateRecord,
  UiLanguage,
} from "@/lib/types";
import { createId, fromJson, nowIso, toJson } from "@/lib/utils";

declare global {
  var commerceStudioDb: DatabaseSync | undefined;
}

export interface DashboardStats {
  jobs: number;
  assets: number;
  templates: number;
  markets: number;
}

export interface JobListFilters {
  search?: string;
  status?: string;
  platform?: string;
  country?: string;
  language?: string;
  imageType?: string;
  resolution?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateJobInput {
  id: string;
  productName: string;
  sku: string;
  category: string;
  brandName: string;
  sellingPoints: string;
  restrictions: string;
  country: string;
  language: string;
  platform: string;
  selectedTypes: string[];
  selectedRatios: string[];
  selectedResolutions: string[];
  variantsPerType: number;
  includeCopyLayout: boolean;
  batchFileCount: number;
  sourceDescription: string;
  uiLanguage: UiLanguage;
  selectedTemplateOverrides: Record<string, string>;
  sourceAssets: AssetRecord[];
  items: JobItemRecord[];
}

function rowToJob(row: any): JobRecord {
  return {
    id: row.id,
    status: row.status,
    productName: row.product_name,
    sku: row.sku,
    category: row.category,
    brandName: row.brand_name,
    sellingPoints: row.selling_points,
    restrictions: row.restrictions,
    country: row.country,
    language: row.language,
    platform: row.platform,
    selectedTypes: fromJson(row.selected_types, []),
    selectedRatios: fromJson(row.selected_ratios, []),
    selectedResolutions: fromJson(row.selected_resolutions, []),
    variantsPerType: row.variants_per_type,
    includeCopyLayout: Boolean(row.include_copy_layout),
    batchFileCount: row.batch_file_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message,
    sourceDescription: row.source_description,
    uiLanguage: row.ui_language,
    selectedTemplateOverrides: fromJson(row.selected_template_overrides, {}),
    localizedInputs: fromJson<LocalizedCreativeInputs | null>(row.localized_inputs_json, null),
  };
}

function rowToItem(row: any): JobItemRecord {
  return {
    id: row.id,
    jobId: row.job_id,
    sourceAssetId: row.source_asset_id,
    sourceAssetName: row.source_asset_name,
    imageType: row.image_type,
    ratio: row.ratio,
    resolutionLabel: row.resolution_label,
    width: row.width,
    height: row.height,
    variantIndex: row.variant_index,
    status: row.status,
    promptText: row.prompt_text,
    negativePrompt: row.negative_prompt,
    copyJson: row.copy_json,
    generatedAssetId: row.generated_asset_id,
    layoutAssetId: row.layout_asset_id,
    reviewStatus: row.review_status ?? "unreviewed",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    errorMessage: row.error_message,
  };
}

function rowToAsset(row: any): AssetRecord {
  return {
    id: row.id,
    jobId: row.job_id,
    jobItemId: row.job_item_id,
    kind: row.kind,
    originalName: row.original_name,
    mimeType: row.mime_type,
    filePath: row.file_path,
    width: row.width,
    height: row.height,
    sizeBytes: row.size_bytes,
    sha256: row.sha256,
    createdAt: row.created_at,
  };
}

function rowToTemplate(row: any): TemplateRecord {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    language: row.language,
    platform: row.platform,
    category: row.category,
    imageType: row.image_type,
    promptTemplate: row.prompt_template,
    copyTemplate: row.copy_template,
    layoutStyle: row.layout_style,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToBrand(row: any): BrandRecord {
  return {
    id: row.id,
    name: row.name,
    primaryColor: row.primary_color,
    tone: row.tone,
    bannedTerms: row.banned_terms,
    promptGuidance: row.prompt_guidance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function ensureSettingsColumns(database: DatabaseSync) {
  const existingColumns = new Set(
    (database.prepare("PRAGMA table_info(settings)").all() as Array<{ name: string }>).map((column) => column.name),
  );

  const columnDefinitions = [
    {
      name: "default_api_base_url",
      statement: "ALTER TABLE settings ADD COLUMN default_api_base_url TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "default_api_version",
      statement: "ALTER TABLE settings ADD COLUMN default_api_version TEXT NOT NULL DEFAULT 'v1beta'",
    },
    {
      name: "default_api_headers",
      statement: "ALTER TABLE settings ADD COLUMN default_api_headers TEXT NOT NULL DEFAULT ''",
    },
  ];

  for (const column of columnDefinitions) {
    if (!existingColumns.has(column.name)) {
      database.exec(column.statement);
    }
  }
}

function ensureJobItemColumns(database: DatabaseSync) {
  const existingColumns = new Set(
    (database.prepare("PRAGMA table_info(job_items)").all() as Array<{ name: string }>).map((column) => column.name),
  );

  const columnDefinitions = [
    {
      name: "review_status",
      statement: "ALTER TABLE job_items ADD COLUMN review_status TEXT NOT NULL DEFAULT 'unreviewed'",
    },
  ];

  for (const column of columnDefinitions) {
    if (!existingColumns.has(column.name)) {
      database.exec(column.statement);
    }
  }
}

function ensureJobColumns(database: DatabaseSync) {
  const existingColumns = new Set(
    (database.prepare("PRAGMA table_info(jobs)").all() as Array<{ name: string }>).map((column) => column.name),
  );

  const columnDefinitions = [
    {
      name: "selected_template_overrides",
      statement: "ALTER TABLE jobs ADD COLUMN selected_template_overrides TEXT NOT NULL DEFAULT '{}'",
    },
    {
      name: "localized_inputs_json",
      statement: "ALTER TABLE jobs ADD COLUMN localized_inputs_json TEXT",
    },
  ];

  for (const column of columnDefinitions) {
    if (!existingColumns.has(column.name)) {
      database.exec(column.statement);
    }
  }
}

function ensureSchema(database: DatabaseSync) {
  database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      default_api_key TEXT NOT NULL DEFAULT '',
      default_text_model TEXT NOT NULL,
      default_image_model TEXT NOT NULL,
      default_api_base_url TEXT NOT NULL DEFAULT '',
      default_api_version TEXT NOT NULL DEFAULT 'v1beta',
      default_api_headers TEXT NOT NULL DEFAULT '',
      storage_dir TEXT NOT NULL,
      max_concurrency INTEGER NOT NULL DEFAULT 2,
      default_ui_language TEXT NOT NULL DEFAULT 'zh',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      category TEXT NOT NULL,
      brand_name TEXT NOT NULL,
      selling_points TEXT NOT NULL,
      restrictions TEXT NOT NULL,
      country TEXT NOT NULL,
      language TEXT NOT NULL,
      platform TEXT NOT NULL,
      selected_types TEXT NOT NULL,
      selected_ratios TEXT NOT NULL,
      selected_resolutions TEXT NOT NULL,
      variants_per_type INTEGER NOT NULL,
      include_copy_layout INTEGER NOT NULL DEFAULT 0,
      batch_file_count INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      error_message TEXT,
      source_description TEXT NOT NULL,
      ui_language TEXT NOT NULL,
      selected_template_overrides TEXT NOT NULL DEFAULT '{}',
      localized_inputs_json TEXT
    );

    CREATE TABLE IF NOT EXISTS job_items (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      source_asset_id TEXT NOT NULL,
      source_asset_name TEXT NOT NULL,
      image_type TEXT NOT NULL,
      ratio TEXT NOT NULL,
      resolution_label TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      variant_index INTEGER NOT NULL,
      status TEXT NOT NULL,
      prompt_text TEXT,
      negative_prompt TEXT,
      copy_json TEXT,
      generated_asset_id TEXT,
      layout_asset_id TEXT,
      review_status TEXT NOT NULL DEFAULT 'unreviewed',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      job_item_id TEXT REFERENCES job_items(id) ON DELETE SET NULL,
      kind TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      size_bytes INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      language TEXT NOT NULL,
      platform TEXT NOT NULL,
      category TEXT NOT NULL,
      image_type TEXT NOT NULL,
      prompt_template TEXT NOT NULL,
      copy_template TEXT NOT NULL,
      layout_style TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      primary_color TEXT NOT NULL,
      tone TEXT NOT NULL,
      banned_terms TEXT NOT NULL,
      prompt_guidance TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_platform ON jobs(platform);
    CREATE INDEX IF NOT EXISTS idx_job_items_job_id ON job_items(job_id);
    CREATE INDEX IF NOT EXISTS idx_assets_job_id ON assets(job_id);
    CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
  `);

  ensureSettingsColumns(database);
  ensureJobColumns(database);
  ensureJobItemColumns(database);

  const existingSettings = database.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
  if (existingSettings.count === 0) {
    const now = nowIso();
    database
      .prepare(
        `INSERT INTO settings (
          id, default_api_key, default_text_model, default_image_model, default_api_base_url, default_api_version, default_api_headers, storage_dir, max_concurrency, default_ui_language, created_at, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        DEFAULT_SETTINGS.defaultApiKey,
        DEFAULT_SETTINGS.defaultTextModel,
        DEFAULT_SETTINGS.defaultImageModel,
        DEFAULT_SETTINGS.defaultApiBaseUrl,
        DEFAULT_SETTINGS.defaultApiVersion,
        DEFAULT_SETTINGS.defaultApiHeaders,
        DEFAULT_SETTINGS.storageDir,
        DEFAULT_SETTINGS.maxConcurrency,
        DEFAULT_SETTINGS.defaultUiLanguage,
        now,
        now,
      );
  }

  const existingTemplates = database.prepare("SELECT COUNT(*) as count FROM templates").get() as { count: number };
  if (existingTemplates.count === 0) {
    const insert = database.prepare(
      `INSERT INTO templates (
        id, name, country, language, platform, category, image_type, prompt_template, copy_template, layout_style, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const template of getTemplateSeedData()) {
      insert.run(
        template.id,
        template.name,
        template.country,
        template.language,
        template.platform,
        template.category,
        template.imageType,
        template.promptTemplate,
        template.copyTemplate,
        template.layoutStyle,
        template.isDefault ? 1 : 0,
        template.createdAt,
        template.updatedAt,
      );
    }
  }
}

export function getDb(): DatabaseSync {
  if (!globalThis.commerceStudioDb) {
    const databaseDir = path.dirname(DEFAULT_DATABASE_PATH);
    fs.mkdirSync(databaseDir, { recursive: true });
    globalThis.commerceStudioDb = new DatabaseSync(DEFAULT_DATABASE_PATH);
    ensureSchema(globalThis.commerceStudioDb);
  }

  return globalThis.commerceStudioDb;
}

export function getSettings(): AppSettings {
  const database = getDb();
  const row = database.prepare("SELECT * FROM settings WHERE id = 1").get() as any;
  return {
    defaultApiKey: row.default_api_key,
    defaultTextModel: row.default_text_model,
    defaultImageModel: row.default_image_model,
    defaultApiBaseUrl: row.default_api_base_url ?? "",
    defaultApiVersion: row.default_api_version ?? "v1beta",
    defaultApiHeaders: row.default_api_headers ?? "",
    storageDir: row.storage_dir,
    maxConcurrency: row.max_concurrency,
    defaultUiLanguage: row.default_ui_language,
  };
}

export function updateSettings(input: Partial<AppSettings>): AppSettings {
  const database = getDb();
  const settings = getSettings();
  const nextSettings: AppSettings = {
    defaultApiKey: input.defaultApiKey ?? settings.defaultApiKey,
    defaultTextModel: input.defaultTextModel ?? settings.defaultTextModel,
    defaultImageModel: input.defaultImageModel ?? settings.defaultImageModel,
    defaultApiBaseUrl: input.defaultApiBaseUrl ?? settings.defaultApiBaseUrl,
    defaultApiVersion: input.defaultApiVersion ?? settings.defaultApiVersion,
    defaultApiHeaders: input.defaultApiHeaders ?? settings.defaultApiHeaders,
    storageDir: input.storageDir ?? settings.storageDir,
    maxConcurrency: input.maxConcurrency ?? settings.maxConcurrency,
    defaultUiLanguage: input.defaultUiLanguage ?? settings.defaultUiLanguage,
  };

  database
    .prepare(
      `UPDATE settings SET
        default_api_key = ?,
        default_text_model = ?,
        default_image_model = ?,
        default_api_base_url = ?,
        default_api_version = ?,
        default_api_headers = ?,
        storage_dir = ?,
        max_concurrency = ?,
        default_ui_language = ?,
        updated_at = ?
      WHERE id = 1`
    )
    .run(
      nextSettings.defaultApiKey,
      nextSettings.defaultTextModel,
      nextSettings.defaultImageModel,
      nextSettings.defaultApiBaseUrl,
      nextSettings.defaultApiVersion,
      nextSettings.defaultApiHeaders,
      nextSettings.storageDir,
      nextSettings.maxConcurrency,
      nextSettings.defaultUiLanguage,
      nowIso(),
    );

  return nextSettings;
}

export function getDashboardStats(): DashboardStats {
  const database = getDb();
  const jobs = database.prepare("SELECT COUNT(*) as count FROM jobs").get() as { count: number };
  const assets = database.prepare("SELECT COUNT(*) as count FROM assets WHERE kind != 'source'").get() as { count: number };
  const templates = database.prepare("SELECT COUNT(*) as count FROM templates").get() as { count: number };
  return {
    jobs: jobs.count,
    assets: assets.count,
    templates: templates.count,
    markets: 10,
  };
}

function matchesTemplateScope(templateValue: string, targetValue: string) {
  return templateValue === "*" || templateValue === targetValue;
}

function scoreTemplateMatch(template: TemplateRecord, input: {
  country: string;
  language: string;
  platform: string;
  category: string;
  imageType: string;
}) {
  let score = 0;
  if (template.country === input.country) score += 16;
  if (template.language === input.language) score += 8;
  if (template.platform === input.platform) score += 4;
  if (template.category === input.category) score += 2;
  if (template.imageType === input.imageType) score += 32;
  return score;
}

export function listTemplates(filters: TemplateFilters = {}): TemplateRecord[] {
  const database = getDb();
  const clauses: string[] = [];
  const values: string[] = [];

  if (filters.search) {
    clauses.push("(name LIKE ? OR prompt_template LIKE ? OR copy_template LIKE ?)");
    values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.country) {
    clauses.push("country = ?");
    values.push(filters.country);
  }
  if (filters.language) {
    clauses.push("language = ?");
    values.push(filters.language);
  }
  if (filters.platform) {
    clauses.push("platform = ?");
    values.push(filters.platform);
  }
  if (filters.category) {
    clauses.push("category = ?");
    values.push(filters.category);
  }
  if (filters.imageType) {
    clauses.push("image_type = ?");
    values.push(filters.imageType);
  }
  if (filters.source === "default") {
    clauses.push("is_default = 1");
  }
  if (filters.source === "custom") {
    clauses.push("is_default = 0");
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return (database.prepare(`SELECT * FROM templates ${where} ORDER BY is_default DESC, updated_at DESC, name ASC`).all(...values) as any[]).map(
    rowToTemplate,
  );
}

export function getTemplateById(templateId: string): TemplateRecord | null {
  const database = getDb();
  const row = database.prepare("SELECT * FROM templates WHERE id = ?").get(templateId) as any;
  return row ? rowToTemplate(row) : null;
}

export function createTemplate(input: TemplateInput): TemplateRecord {
  const database = getDb();
  const now = nowIso();
  const id = createId("tpl");

  database
    .prepare(
      `INSERT INTO templates (
        id, name, country, language, platform, category, image_type, prompt_template, copy_template, layout_style, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.name,
      input.country,
      input.language,
      input.platform,
      input.category,
      input.imageType,
      input.promptTemplate,
      input.copyTemplate,
      input.layoutStyle,
      input.isDefault ? 1 : 0,
      now,
      now,
    );

  return getTemplateById(id)!;
}

export function updateTemplate(templateId: string, input: Partial<TemplateInput>): TemplateRecord | null {
  const database = getDb();
  const existing = getTemplateById(templateId);
  if (!existing) {
    return null;
  }

  const nextTemplate = {
    name: input.name ?? existing.name,
    country: input.country ?? existing.country,
    language: input.language ?? existing.language,
    platform: input.platform ?? existing.platform,
    category: input.category ?? existing.category,
    imageType: input.imageType ?? existing.imageType,
    promptTemplate: input.promptTemplate ?? existing.promptTemplate,
    copyTemplate: input.copyTemplate ?? existing.copyTemplate,
    layoutStyle: input.layoutStyle ?? existing.layoutStyle,
    isDefault: input.isDefault ?? existing.isDefault,
  };

  database
    .prepare(
      `UPDATE templates SET
        name = ?,
        country = ?,
        language = ?,
        platform = ?,
        category = ?,
        image_type = ?,
        prompt_template = ?,
        copy_template = ?,
        layout_style = ?,
        is_default = ?,
        updated_at = ?
      WHERE id = ?`
    )
    .run(
      nextTemplate.name,
      nextTemplate.country,
      nextTemplate.language,
      nextTemplate.platform,
      nextTemplate.category,
      nextTemplate.imageType,
      nextTemplate.promptTemplate,
      nextTemplate.copyTemplate,
      nextTemplate.layoutStyle,
      nextTemplate.isDefault ? 1 : 0,
      nowIso(),
      templateId,
    );

  return getTemplateById(templateId);
}

export function deleteTemplate(templateId: string): boolean {
  const database = getDb();
  const existing = getTemplateById(templateId);
  if (!existing || existing.isDefault) {
    return false;
  }

  const result = database.prepare("DELETE FROM templates WHERE id = ?").run(templateId);
  return result.changes > 0;
}

export function resolveTemplate(input: {
  country: string;
  language: string;
  platform: string;
  category: string;
  imageType: string;
}): TemplateRecord | null {
  const candidates = listTemplateCandidates(input).filter(
    (template) =>
      matchesTemplateScope(template.country, input.country) &&
      matchesTemplateScope(template.language, input.language) &&
      matchesTemplateScope(template.platform, input.platform) &&
      matchesTemplateScope(template.category, input.category) &&
      matchesTemplateScope(template.imageType, input.imageType),
  );

  if (!candidates.length) {
    return null;
  }

  return candidates.sort((left, right) => {
    const scoreDelta = scoreTemplateMatch(right, input) - scoreTemplateMatch(left, input);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }
    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? 1 : -1;
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  })[0] ?? null;
}

export function listTemplateCandidates(input: {
  country: string;
  language: string;
  platform: string;
  category: string;
  imageType: string;
}): TemplateRecord[] {
  return listTemplates({ imageType: input.imageType }).sort((left, right) => {
    const scoreDelta = scoreTemplateMatch(right, input) - scoreTemplateMatch(left, input);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }
    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? 1 : -1;
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function createJob(input: CreateJobInput): JobRecord {
  const database = getDb();
  const now = nowIso();
  database.exec("BEGIN");

  try {
    database
      .prepare(
        `INSERT INTO jobs (
          id, status, product_name, sku, category, brand_name, selling_points, restrictions, country, language, platform,
          selected_types, selected_ratios, selected_resolutions, variants_per_type, include_copy_layout,
          batch_file_count, created_at, updated_at, source_description, ui_language, selected_template_overrides
        ) VALUES (?, 'queued', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.id,
        input.productName,
        input.sku,
        input.category,
        input.brandName,
        input.sellingPoints,
        input.restrictions,
        input.country,
        input.language,
        input.platform,
        toJson(input.selectedTypes),
        toJson(input.selectedRatios),
        toJson(input.selectedResolutions),
        input.variantsPerType,
        input.includeCopyLayout ? 1 : 0,
        input.batchFileCount,
        now,
        now,
        input.sourceDescription,
        input.uiLanguage,
        toJson(input.selectedTemplateOverrides),
      );

    const insertAsset = database.prepare(
      `INSERT INTO assets (
        id, job_id, job_item_id, kind, original_name, mime_type, file_path, width, height, size_bytes, sha256, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const asset of input.sourceAssets) {
      insertAsset.run(
        asset.id,
        asset.jobId,
        asset.jobItemId,
        asset.kind,
        asset.originalName,
        asset.mimeType,
        asset.filePath,
        asset.width,
        asset.height,
        asset.sizeBytes,
        asset.sha256,
        asset.createdAt,
      );
    }

    const insertItem = database.prepare(
      `INSERT INTO job_items (
        id, job_id, source_asset_id, source_asset_name, image_type, ratio, resolution_label, width, height, variant_index,
        status, prompt_text, negative_prompt, copy_json, generated_asset_id, layout_asset_id, review_status, created_at, updated_at, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const item of input.items) {
      insertItem.run(
        item.id,
        item.jobId,
        item.sourceAssetId,
        item.sourceAssetName,
        item.imageType,
        item.ratio,
        item.resolutionLabel,
        item.width,
        item.height,
        item.variantIndex,
        item.status,
        item.promptText,
        item.negativePrompt,
        item.copyJson,
        item.generatedAssetId,
        item.layoutAssetId,
        item.reviewStatus,
        item.createdAt,
        item.updatedAt,
        item.errorMessage,
      );
    }

    database.exec("COMMIT");
    return getJobById(input.id)!;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function getJobById(jobId: string): JobRecord | null {
  const database = getDb();
  const row = database.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as any;
  return row ? rowToJob(row) : null;
}

export function getJobDetails(jobId: string): JobDetails | null {
  const database = getDb();
  const job = getJobById(jobId);
  if (!job) {
    return null;
  }

  const sourceAssets = (database
    .prepare("SELECT * FROM assets WHERE job_id = ? AND kind = 'source' ORDER BY created_at ASC")
    .all(jobId) as any[]).map(rowToAsset);
  const items = (database
    .prepare("SELECT * FROM job_items WHERE job_id = ? ORDER BY created_at ASC")
    .all(jobId) as any[]).map(rowToItem);
  const allAssets = (database.prepare("SELECT * FROM assets WHERE job_id = ?").all(jobId) as any[]).map(rowToAsset);
  const assetMap = new Map(allAssets.map((asset) => [asset.id, asset]));

  return {
    job,
    sourceAssets,
    items: items.map((item) => ({
      ...item,
      generatedAsset: item.generatedAssetId ? assetMap.get(item.generatedAssetId) ?? null : null,
      layoutAsset: item.layoutAssetId ? assetMap.get(item.layoutAssetId) ?? null : null,
      copy: fromJson<GeneratedCopyBundle | null>(item.copyJson, null),
    })),
  };
}

export function getJobItemById(itemId: string): JobItemRecord | null {
  const database = getDb();
  const row = database.prepare("SELECT * FROM job_items WHERE id = ?").get(itemId) as any;
  return row ? rowToItem(row) : null;
}

export function listJobs(filters: JobListFilters = {}): JobRecord[] {
  const database = getDb();
  const clauses: string[] = [];
  const values: Array<string> = [];

  if (filters.search) {
    clauses.push("(product_name LIKE ? OR sku LIKE ?)");
    values.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.status) {
    clauses.push("status = ?");
    values.push(filters.status);
  }
  if (filters.platform) {
    clauses.push("platform = ?");
    values.push(filters.platform);
  }
  if (filters.country) {
    clauses.push("country = ?");
    values.push(filters.country);
  }
  if (filters.language) {
    clauses.push("language = ?");
    values.push(filters.language);
  }
  if (filters.imageType) {
    clauses.push("selected_types LIKE ?");
    values.push(`%${filters.imageType}%`);
  }
  if (filters.resolution) {
    clauses.push("selected_resolutions LIKE ?");
    values.push(`%${filters.resolution}%`);
  }
  if (filters.dateFrom) {
    clauses.push("created_at >= ?");
    values.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    clauses.push("created_at <= ?");
    values.push(filters.dateTo);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const statement = database.prepare(`SELECT * FROM jobs ${where} ORDER BY created_at DESC LIMIT 200`);
  return (statement.all(...values) as any[]).map(rowToJob);
}

export function listRecentJobs(limit = 6): JobRecord[] {
  const database = getDb();
  return (database.prepare("SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?").all(limit) as any[]).map(rowToJob);
}

export function getAssetById(assetId: string): AssetRecord | null {
  const database = getDb();
  const row = database.prepare("SELECT * FROM assets WHERE id = ?").get(assetId) as any;
  return row ? rowToAsset(row) : null;
}

export function updateJobStatus(jobId: string, status: JobStatus, errorMessage?: string | null) {
  const database = getDb();
  const isFinished = status === "completed" || status === "failed" || status === "partial";
  database
    .prepare("UPDATE jobs SET status = ?, error_message = ?, updated_at = ?, completed_at = ? WHERE id = ?")
    .run(status, errorMessage ?? null, nowIso(), isFinished ? nowIso() : null, jobId);
}

export function updateJobLocalizedInputs(jobId: string, localizedInputs: LocalizedCreativeInputs | null) {
  const database = getDb();
  database
    .prepare("UPDATE jobs SET localized_inputs_json = ?, updated_at = ? WHERE id = ?")
    .run(toJson(localizedInputs), nowIso(), jobId);
}

export function updateJobItemProcessing(itemId: string) {
  const database = getDb();
  database.prepare("UPDATE job_items SET status = 'processing', updated_at = ? WHERE id = ?").run(nowIso(), itemId);
}

export function updateJobItemResult(input: {
  itemId: string;
  promptText: string;
  copy: GeneratedCopyBundle;
  generatedAssetId: string;
  layoutAssetId?: string | null;
}) {
  const database = getDb();
  database
    .prepare(
      `UPDATE job_items SET
        status = 'completed',
        prompt_text = ?,
        copy_json = ?,
        generated_asset_id = ?,
        layout_asset_id = ?,
        error_message = NULL,
        updated_at = ?
      WHERE id = ?`
    )
    .run(
      input.promptText,
      toJson(input.copy),
      input.generatedAssetId,
      input.layoutAssetId ?? null,
      nowIso(),
      input.itemId,
    );
}

export function updateJobItemFailure(itemId: string, errorMessage: string) {
  const database = getDb();
  database
    .prepare("UPDATE job_items SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?")
    .run(errorMessage, nowIso(), itemId);
}

export function insertAsset(asset: AssetRecord) {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO assets (
        id, job_id, job_item_id, kind, original_name, mime_type, file_path, width, height, size_bytes, sha256, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      asset.id,
      asset.jobId,
      asset.jobItemId,
      asset.kind,
      asset.originalName,
      asset.mimeType,
      asset.filePath,
      asset.width,
      asset.height,
      asset.sizeBytes,
      asset.sha256,
      asset.createdAt,
    );
}

export function listJobItems(jobId: string): JobItemRecord[] {
  const database = getDb();
  return (database.prepare("SELECT * FROM job_items WHERE job_id = ? ORDER BY created_at ASC").all(jobId) as any[]).map(rowToItem);
}

export function updateJobItemReviewStatus(itemId: string, reviewStatus: JobItemReviewStatus): JobItemRecord | null {
  const database = getDb();
  database.prepare("UPDATE job_items SET review_status = ?, updated_at = ? WHERE id = ?").run(reviewStatus, nowIso(), itemId);
  return getJobItemById(itemId);
}

export function listBrands(): BrandRecord[] {
  const database = getDb();
  return (database.prepare("SELECT * FROM brands ORDER BY updated_at DESC, name ASC").all() as any[]).map(rowToBrand);
}

export function getBrandById(brandId: string): BrandRecord | null {
  const database = getDb();
  const row = database.prepare("SELECT * FROM brands WHERE id = ?").get(brandId) as any;
  return row ? rowToBrand(row) : null;
}

export function getBrandByName(name: string): BrandRecord | null {
  const database = getDb();
  const row = database.prepare("SELECT * FROM brands WHERE LOWER(name) = LOWER(?)").get(name.trim()) as any;
  return row ? rowToBrand(row) : null;
}

export function createBrand(input: BrandInput): BrandRecord {
  const database = getDb();
  const now = nowIso();
  const id = createId("brand");
  database
    .prepare(
      `INSERT INTO brands (
        id, name, primary_color, tone, banned_terms, prompt_guidance, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.name.trim(), input.primaryColor, input.tone, input.bannedTerms, input.promptGuidance, now, now);

  return getBrandById(id)!;
}

export function updateBrand(brandId: string, input: Partial<BrandInput>): BrandRecord | null {
  const database = getDb();
  const existing = getBrandById(brandId);
  if (!existing) {
    return null;
  }

  const nextBrand = {
    name: input.name?.trim() ?? existing.name,
    primaryColor: input.primaryColor ?? existing.primaryColor,
    tone: input.tone ?? existing.tone,
    bannedTerms: input.bannedTerms ?? existing.bannedTerms,
    promptGuidance: input.promptGuidance ?? existing.promptGuidance,
  };

  database
    .prepare(
      `UPDATE brands SET
        name = ?,
        primary_color = ?,
        tone = ?,
        banned_terms = ?,
        prompt_guidance = ?,
        updated_at = ?
      WHERE id = ?`
    )
    .run(nextBrand.name, nextBrand.primaryColor, nextBrand.tone, nextBrand.bannedTerms, nextBrand.promptGuidance, nowIso(), brandId);

  return getBrandById(brandId);
}

export function deleteBrand(brandId: string): boolean {
  const database = getDb();
  const result = database.prepare("DELETE FROM brands WHERE id = ?").run(brandId);
  return result.changes > 0;
}
