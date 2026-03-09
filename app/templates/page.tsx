import { TemplateCenterClient } from "@/components/template-center-client";
import { listTemplates } from "@/lib/db";
import { getUiLanguage } from "@/lib/ui-language";

export default async function TemplatesPage() {
  const language = await getUiLanguage();
  const templates = listTemplates();

  return <TemplateCenterClient initialTemplates={templates} language={language} />;
}
