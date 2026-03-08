import type { TemplateRecord, UiLanguage } from "@/lib/types";

export function TemplateGrid({ templates, language }: { templates: TemplateRecord[]; language: UiLanguage }) {
  return (
    <div className="template-grid">
      {templates.map((template) => (
        <article className="panel template-card" key={template.id}>
          <span className="eyebrow">{template.imageType}</span>
          <h3>{template.name}</h3>
          <p>{template.promptTemplate}</p>
          <dl>
            <div>
              <dt>{language === "zh" ? "文案策略" : "Copy angle"}</dt>
              <dd>{template.copyTemplate}</dd>
            </div>
            <div>
              <dt>{language === "zh" ? "版式策略" : "Layout"}</dt>
              <dd>{template.layoutStyle}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
