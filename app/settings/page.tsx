import { BrandLibraryManager } from "@/components/brand-library-manager";
import { SettingsForm } from "@/components/settings-form";
import { getSettings, listBrands } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getUiLanguage } from "@/lib/ui-language";

export default async function SettingsPage() {
  const language = await getUiLanguage();
  const settings = getSettings();
  const brands = listBrands();

  return (
    <div className="stack gap-24">
      <section className="panel">
        <p className="eyebrow">{t(language, "navSettings")}</p>
        <h2>{t(language, "settingsTitle")}</h2>
        <p>
          {language === "zh"
            ? "这里同时支持 Google 官方 Gemini、Gemini 兼容中转，以及飞书多维表格自动同步。使用官方接口时，Base URL 留空即可；使用中转时，填写对方提供的 base_url。"
            : "This page supports the official Google Gemini API, Gemini-compatible relay services, and automatic Feishu Bitable sync. Leave Base URL empty for Google, or paste the relay provider's base_url here."}
        </p>
      </section>

      <section className="settings-layout">
        <SettingsForm initialSettings={settings} language={language} />
        <BrandLibraryManager initialBrands={brands} language={language} />
      </section>
    </div>
  );
}
