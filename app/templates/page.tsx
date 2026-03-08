import { TemplateGrid } from "@/components/template-grid";
import { listTemplates } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getUiLanguage } from "@/lib/ui-language";

export default async function TemplatesPage() {
  const language = await getUiLanguage();
  const templates = listTemplates();

  return (
    <div className="stack gap-24">
      <section className="panel">
        <p className="eyebrow">{t(language, "navTemplates")}</p>
        <h2>{t(language, "templatesTitle")}</h2>
        <p>{language === "zh" ? "当前展示默认模板种子，后续可以扩展为按国家 / 平台 / 品类自定义。" : "The current view shows the built-in template seeds. It can be extended into editable market, platform, and category templates later."}</p>
      </section>
      <TemplateGrid language={language} templates={templates} />
    </div>
  );
}
