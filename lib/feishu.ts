import type { AppSettings, AssetRecord, FeishuFieldMapping, JobItemRecord, JobRecord } from "@/lib/types";

const FEISHU_OPEN_BASE_URL = "https://open.feishu.cn";
const FEISHU_MEDIA_UPLOAD_ALL_LIMIT = 20 * 1024 * 1024;
const DEFAULT_FEISHU_MEDIA_BLOCK_SIZE = 4 * 1024 * 1024;

type FeishuChunkSeqMode = "index" | "offset";

type FeishuApiEnvelope<T> = {
  code?: number;
  msg?: string;
  message?: string;
  data?: T;
};

type FeishuTokenResponse = {
  code?: number;
  msg?: string;
  tenant_access_token?: string;
  expire?: number;
};

type FeishuMediaUploadResponse = {
  file_token?: string;
};

type FeishuMediaUploadPrepareResponse = {
  upload_id?: string;
  block_size?: number;
  block_num?: number;
};

type FeishuRecordResponse = {
  record?: {
    record_id?: string;
  };
};

type FeishuFieldListResponse = {
  items?: Array<{
    field_name?: string;
    ui_type?: string;
    type?: number;
  }>;
};

function ensureFeishuConfigured(settings: AppSettings) {
  if (!settings.feishuAppId || !settings.feishuAppSecret) {
    throw new Error("Feishu App ID and App Secret are required.");
  }

  if (!settings.feishuBitableAppToken || !settings.feishuBitableTableId) {
    throw new Error("Feishu Bitable app token and table ID are required.");
  }
}

function sanitizeFeishuFileName(originalName: string) {
  const fallback = "generated-image.png";
  const trimmed = originalName.trim();
  if (!trimmed) {
    return fallback;
  }

  const extensionMatch = trimmed.match(/(\.[A-Za-z0-9]+)$/);
  const extension = extensionMatch?.[1] ?? "";
  const baseName = extension ? trimmed.slice(0, -extension.length) : trimmed;
  const safeBaseName = baseName
    .replace(/[\\/:*?"<>|\r\n]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const normalizedBaseName = safeBaseName || "generated-image";
  const maxBaseLength = Math.max(1, 120 - extension.length);

  return `${normalizedBaseName.slice(0, maxBaseLength)}${extension}`;
}

function computeAdler32(buffer: Buffer) {
  const MOD_ADLER = 65521;
  let a = 1;
  let b = 0;

  for (const value of buffer) {
    a = (a + value) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }

  return (((b << 16) | a) >>> 0).toString();
}

function isFeishuParamsError(error: unknown) {
  return error instanceof Error && /params error/i.test(error.message);
}

function formatFeishuErrorMessage(payload: (FeishuApiEnvelope<unknown> & Record<string, unknown>) | null, response: Response) {
  const code = payload?.code;
  const baseMessage = payload?.msg || payload?.message || `Feishu request failed with HTTP ${response.status}.`;

  if (code === 1061004) {
    return `${baseMessage} According to Feishu docs, the current calling identity does not have edit permission on the target cloud document. Please add the app (or a group containing the app) as a collaborator to the target Bitable with edit/manage permission, then publish the app permissions again if needed.`;
  }

  if (code === 1061073) {
    return `${baseMessage} The app does not have the required Feishu API scope. Please check the app scopes for Bitable and Drive/Media upload, then publish the latest app version.`;
  }

  return baseMessage;
}

async function requestFeishuJson<T>(
  path: string,
  init: RequestInit,
  options?: { unwrap?: "data" | "root" },
): Promise<T> {
  const response = await fetch(`${FEISHU_OPEN_BASE_URL}${path}`, init);
  const payload = (await response.json().catch(() => null)) as (FeishuApiEnvelope<T> & Record<string, unknown>) | null;

  if (!response.ok) {
    throw new Error(formatFeishuErrorMessage(payload, response));
  }

  if ((payload?.code ?? 0) !== 0) {
    throw new Error(formatFeishuErrorMessage(payload, response));
  }

  if (options?.unwrap === "root") {
    return (payload ?? {}) as T;
  }

  return (payload?.data ?? {}) as T;
}

export function parseFeishuFieldMapping(rawJson?: string): FeishuFieldMapping {
  if (!rawJson?.trim()) {
    return {};
  }

  const parsed = JSON.parse(rawJson) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Feishu field mapping JSON must be an object.");
  }

  const mapping: FeishuFieldMapping = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string" && value.trim()) {
      const normalizedKey = key === "file" ? "image" : key;
      mapping[normalizedKey as keyof FeishuFieldMapping] = value.trim();
    }
  }

  return mapping;
}

export async function getFeishuTenantAccessToken(settings: AppSettings) {
  ensureFeishuConfigured(settings);

  const data = await requestFeishuJson<FeishuTokenResponse>("/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      app_id: settings.feishuAppId,
      app_secret: settings.feishuAppSecret,
    }),
  }, { unwrap: "root" });

  if (!data.tenant_access_token) {
    throw new Error("Feishu did not return a tenant access token.");
  }

  return data.tenant_access_token;
}

export async function testFeishuConnection(settings: AppSettings) {
  const accessToken = await getFeishuTenantAccessToken(settings);
  await requestFeishuJson<{ items?: unknown[] }>(
    `/open-apis/bitable/v1/apps/${settings.feishuBitableAppToken}/tables/${settings.feishuBitableTableId}/records?page_size=1`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const fields = await requestFeishuJson<FeishuFieldListResponse>(
    `/open-apis/bitable/v1/apps/${settings.feishuBitableAppToken}/tables/${settings.feishuBitableTableId}/fields?page_size=100`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const mapping = parseFeishuFieldMapping(settings.feishuFieldMappingJson);
  const configuredFieldNames = Array.from(
    new Set(Object.values(mapping).filter((value): value is string => Boolean(value?.trim()))),
  );
  const availableFieldNames = new Set((fields.items ?? []).map((item) => item.field_name).filter(Boolean));
  const missingFieldNames = configuredFieldNames.filter((fieldName) => !availableFieldNames.has(fieldName));

  if (missingFieldNames.length > 0) {
    const existing = Array.from(availableFieldNames).join("、") || "（空）";
    throw new Error(
      `Feishu table fields do not match the field mapping. Missing: ${missingFieldNames.join("、")}. Existing fields: ${existing}.`,
    );
  }

  try {
    const probeBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP6sAAAAASUVORK5CYII=",
      "base64",
    );
    await uploadAssetToFeishuBitable({
      accessToken,
      settings,
      asset: {
        id: "probe",
        jobId: "probe",
        jobItemId: null,
        kind: "generated",
        originalName: "codex-feishu-probe.png",
        mimeType: "image/png",
        filePath: "",
        width: 1,
        height: 1,
        sizeBytes: probeBuffer.byteLength,
        sha256: "",
        createdAt: new Date().toISOString(),
      },
      buffer: probeBuffer,
    });
  } catch (error) {
    throw new Error(
      `Feishu image upload failed. Please check app scopes and the parent_type setting. ${
        error instanceof Error ? error.message : "Unknown upload error."
      }`,
    );
  }

  return "Feishu Bitable connection and image upload succeeded.";
}

async function uploadAssetToFeishuBitable(input: {
  accessToken: string;
  settings: AppSettings;
  asset: AssetRecord;
  buffer: Buffer;
}) {
  const fileName = sanitizeFeishuFileName(input.asset.originalName);
  const parentType = input.settings.feishuUploadParentType || "bitable_image";
  const parentNode = input.settings.feishuBitableAppToken;

  const toArrayBuffer = (buffer: Buffer) =>
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

  const uploadAssetInChunks = async (seqMode: FeishuChunkSeqMode) => {
    const prepared = await requestFeishuJson<FeishuMediaUploadPrepareResponse>(
      "/open-apis/drive/v1/medias/upload_prepare",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          file_name: fileName,
          parent_type: parentType,
          parent_node: parentNode,
          size: input.buffer.byteLength,
        }),
      },
    );

    if (!prepared.upload_id) {
      throw new Error("Feishu media upload prepare did not return an upload ID.");
    }

    const blockSize = prepared.block_size || DEFAULT_FEISHU_MEDIA_BLOCK_SIZE;
    const chunks: Array<{ start: number; buffer: Buffer }> = [];
    for (let start = 0; start < input.buffer.byteLength; start += blockSize) {
      chunks.push({
        start,
        buffer: input.buffer.subarray(start, Math.min(start + blockSize, input.buffer.byteLength)),
      });
    }

    for (const [index, chunk] of chunks.entries()) {
      const partForm = new FormData();
      partForm.set("upload_id", prepared.upload_id);
      partForm.set("seq", seqMode === "offset" ? String(chunk.start) : String(index));
      partForm.set("size", String(chunk.buffer.byteLength));
      partForm.set("checksum", computeAdler32(chunk.buffer));
      partForm.set("file", new Blob([toArrayBuffer(chunk.buffer)], { type: input.asset.mimeType }), fileName);

      await requestFeishuJson<null>(
        "/open-apis/drive/v1/medias/upload_part",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${input.accessToken}`,
          },
          body: partForm,
        },
      );
    }

    return requestFeishuJson<FeishuMediaUploadResponse>(
      "/open-apis/drive/v1/medias/upload_finish",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          upload_id: prepared.upload_id,
          block_num: prepared.block_num || chunks.length,
        }),
      },
    );
  };

  let data: FeishuMediaUploadResponse | null = null;
  if (input.buffer.byteLength <= FEISHU_MEDIA_UPLOAD_ALL_LIMIT) {
    const form = new FormData();
    form.set("file_name", fileName);
    form.set("parent_type", parentType);
    form.set("parent_node", parentNode);
    form.set("size", String(input.buffer.byteLength));
    form.set("file", new Blob([toArrayBuffer(input.buffer)], { type: input.asset.mimeType }), fileName);

    data = await requestFeishuJson<FeishuMediaUploadResponse>(
      "/open-apis/drive/v1/medias/upload_all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
        },
        body: form,
      },
    );
  } else {
    const chunkUploadErrors: string[] = [];
    for (const seqMode of ["index", "offset"] as const) {
      try {
        data = await uploadAssetInChunks(seqMode);
        chunkUploadErrors.length = 0;
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown upload error.";
        chunkUploadErrors.push(`${seqMode}: ${message}`);
        if (!isFeishuParamsError(error) || seqMode === "offset") {
          throw new Error(`Feishu chunk upload failed. ${chunkUploadErrors.join(" | ")}`);
        }
      }
    }

    if (!data) {
      throw new Error("Feishu chunk upload failed without a response.");
    }
  }

  if (!data.file_token) {
    throw new Error("Feishu media upload did not return a file token.");
  }

  return data.file_token;
}

function buildModeLabel(mode: JobRecord["creationMode"]) {
  switch (mode) {
    case "prompt":
      return "提示词模式";
    case "reference-remix":
      return "参考图复刻";
    default:
      return "标准出图";
  }
}

function buildRecordTitle(job: JobRecord, item: JobItemRecord) {
  const promptTitle = job.customPrompt?.trim().slice(0, 60);
  const baseTitle = job.productName?.trim() || promptTitle || "AI 生成图片";
  return `${baseTitle} · ${item.imageType} · #${item.variantIndex}`;
}

function putField(
  fields: Record<string, unknown>,
  mapping: FeishuFieldMapping,
  key: keyof FeishuFieldMapping,
  value: unknown,
) {
  const fieldName = mapping[key];
  if (!fieldName) {
    return;
  }

  if (value === undefined || value === null || value === "") {
    return;
  }

  fields[fieldName] = value;
}

export async function syncGeneratedImageToFeishu(input: {
  settings: AppSettings;
  asset: AssetRecord;
  assetBuffer: Buffer;
  job: JobRecord;
  item: JobItemRecord;
  promptText: string | null;
  negativePrompt: string | null;
}) {
  if (!input.settings.feishuSyncEnabled) {
    return null;
  }

  const mapping = parseFeishuFieldMapping(input.settings.feishuFieldMappingJson);
  if (!mapping.image) {
    throw new Error("Feishu image field mapping is required.");
  }

  const accessToken = await getFeishuTenantAccessToken(input.settings);
  let fileToken: string;
  try {
    fileToken = await uploadAssetToFeishuBitable({
      accessToken,
      settings: input.settings,
      asset: input.asset,
      buffer: input.assetBuffer,
    });
  } catch (error) {
    const sizeMb = (input.assetBuffer.byteLength / (1024 * 1024)).toFixed(2);
    throw new Error(
      `Feishu image upload failed for ${input.asset.originalName} (${sizeMb} MB): ${
        error instanceof Error ? error.message : "Unknown upload error."
      }`,
    );
  }

  const fields: Record<string, unknown> = {};
  putField(fields, mapping, "title", buildRecordTitle(input.job, input.item));
  putField(fields, mapping, "image", [{ file_token: fileToken }]);
  putField(fields, mapping, "prompt", input.promptText);
  putField(fields, mapping, "negativePrompt", input.negativePrompt);
  putField(fields, mapping, "status", "completed");
  putField(fields, mapping, "mode", buildModeLabel(input.job.creationMode));
  putField(fields, mapping, "platform", input.job.platform);
  putField(fields, mapping, "country", input.job.country);
  putField(fields, mapping, "language", input.job.language);
  putField(fields, mapping, "ratio", input.item.ratio);
  putField(fields, mapping, "resolution", input.item.resolutionLabel);
  putField(fields, mapping, "requestedSize", `${input.item.width}×${input.item.height}`);
  putField(
    fields,
    mapping,
    "actualSize",
    input.asset.width && input.asset.height ? `${input.asset.width}×${input.asset.height}` : null,
  );
  putField(fields, mapping, "jobId", input.job.id);
  putField(fields, mapping, "itemId", input.item.id);
  putField(fields, mapping, "createdAt", input.asset.createdAt);

  let data: FeishuRecordResponse;
  try {
    data = await requestFeishuJson<FeishuRecordResponse>(
      `/open-apis/bitable/v1/apps/${input.settings.feishuBitableAppToken}/tables/${input.settings.feishuBitableTableId}/records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ fields }),
      },
    );
  } catch (error) {
    throw new Error(
      `Feishu record creation failed: ${error instanceof Error ? error.message : "Unknown record creation error."}`,
    );
  }

  return {
    recordId: data.record?.record_id ?? null,
    fileToken,
  };
}
