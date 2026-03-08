import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getUiLanguage } from "@/lib/ui-language";

export default async function SettingsPage() {
  const language = await getUiLanguage();
  const settings = getSettings();

  return (
    <div className="stack gap-24">
      <section className="panel">
        <p className="eyebrow">{t(language, "navSettings")}</p>
        <h2>{t(language, "settingsTitle")}</h2>
        <p>
          {language === "zh"
            ? "这里既支持 Google 官方 Gemini，也支持 Gemini 兼容中转站。官方接口时 Base URL 留空；使用中转站时填写对方给你的 base_url。"
            : "This page supports both Google official Gemini and Gemini-compatible relay services. Leave Base URL empty for Google, or paste the provider's base_url here for a relay."}
        </p>
      </section>
      <SettingsForm initialSettings={settings} language={language} />
    </div>
  );
}