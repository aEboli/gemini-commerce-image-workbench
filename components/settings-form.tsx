"use client";

import { useMemo, useState, useTransition } from "react";

import type { AppSettings, UiLanguage } from "@/lib/types";

export function SettingsForm({ initialSettings, language }: { initialSettings: AppSettings; language: UiLanguage }) {
  const [formState, setFormState] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTestTransition] = useTransition();

  const text = useMemo(
    () =>
      language === "zh"
        ? {
            defaultApiKey: "默认 API Key",
            defaultTextModel: "默认文本模型",
            defaultImageModel: "默认图像模型",
            defaultApiBaseUrl: "Gemini Base URL / 中转站地址",
            defaultApiVersion: "API 版本",
            defaultApiHeaders: "自定义请求头 JSON（可选）",
            storageDir: "素材存储目录",
            maxConcurrency: "并发任务数",
            save: "保存设置",
            saving: "保存中...",
            saved: "设置已保存",
            test: "测试连接",
            testing: "测试中...",
            testOk: "连接成功",
            testFailed: "连接失败",
            baseUrlHint: "留空表示走 Google 官方接口；使用中转站时填对方提供的 base_url。",
            headersHint: "示例：{\"Authorization\":\"Bearer your-key\"}，如果中转站不需要额外请求头就留空。",
            versionHint: "大多数 Gemini 兼容接口使用 v1beta。",
          }
        : {
            defaultApiKey: "Default API key",
            defaultTextModel: "Default text model",
            defaultImageModel: "Default image model",
            defaultApiBaseUrl: "Gemini base URL / relay URL",
            defaultApiVersion: "API version",
            defaultApiHeaders: "Custom headers JSON (optional)",
            storageDir: "Asset storage directory",
            maxConcurrency: "Max concurrent jobs",
            save: "Save settings",
            saving: "Saving...",
            saved: "Settings saved",
            test: "Test connection",
            testing: "Testing...",
            testOk: "Connection succeeded",
            testFailed: "Connection failed",
            baseUrlHint: "Leave blank for Google official Gemini API. For a relay, paste the provider's base_url here.",
            headersHint: "Example: {\"Authorization\":\"Bearer your-key\"}. Leave empty if your relay does not require extra headers.",
            versionHint: "Most Gemini-compatible relays use v1beta.",
          },
    [language],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "Save failed.");
        return;
      }

      setMessage(text.saved);
    });
  }

  function handleTest() {
    setTestMessage("");

    startTestTransition(async () => {
      const response = await fetch("/api/settings/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const body = (await response.json().catch(() => null)) as { error?: string; result?: string } | null;
      if (!response.ok) {
        setTestMessage(`${text.testFailed}: ${body?.error ?? "Unknown error"}`);
        return;
      }

      setTestMessage(`${text.testOk}: ${body?.result ?? "OK"}`);
    });
  }

  return (
    <form className="panel form-panel narrow" onSubmit={handleSubmit}>
      <label>
        <span>{text.defaultApiKey}</span>
        <input type="password" value={formState.defaultApiKey} onChange={(event) => setFormState({ ...formState, defaultApiKey: event.target.value })} />
      </label>
      <label>
        <span>{text.defaultApiBaseUrl}</span>
        <input placeholder="https://your-relay-host.example" value={formState.defaultApiBaseUrl} onChange={(event) => setFormState({ ...formState, defaultApiBaseUrl: event.target.value })} />
        <small className="helper">{text.baseUrlHint}</small>
      </label>
      <label>
        <span>{text.defaultApiVersion}</span>
        <input value={formState.defaultApiVersion} onChange={(event) => setFormState({ ...formState, defaultApiVersion: event.target.value })} />
        <small className="helper">{text.versionHint}</small>
      </label>
      <label>
        <span>{text.defaultApiHeaders}</span>
        <textarea rows={4} placeholder='{"Authorization":"Bearer your-key"}' value={formState.defaultApiHeaders} onChange={(event) => setFormState({ ...formState, defaultApiHeaders: event.target.value })} />
        <small className="helper">{text.headersHint}</small>
      </label>
      <label>
        <span>{text.defaultTextModel}</span>
        <input value={formState.defaultTextModel} onChange={(event) => setFormState({ ...formState, defaultTextModel: event.target.value })} />
      </label>
      <label>
        <span>{text.defaultImageModel}</span>
        <input value={formState.defaultImageModel} onChange={(event) => setFormState({ ...formState, defaultImageModel: event.target.value })} />
      </label>
      <label>
        <span>{text.storageDir}</span>
        <input value={formState.storageDir} onChange={(event) => setFormState({ ...formState, storageDir: event.target.value })} />
      </label>
      <label>
        <span>{text.maxConcurrency}</span>
        <input min={1} max={6} type="number" value={formState.maxConcurrency} onChange={(event) => setFormState({ ...formState, maxConcurrency: Number(event.target.value) || 1 })} />
      </label>
      {message ? <p className="helper success-text">{message}</p> : null}
      {testMessage ? <p className="helper">{testMessage}</p> : null}
      <div className="button-row">
        <button className="ghost-button" disabled={isTesting} onClick={handleTest} type="button">
          {isTesting ? text.testing : text.test}
        </button>
        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? text.saving : text.save}
        </button>
      </div>
    </form>
  );
}