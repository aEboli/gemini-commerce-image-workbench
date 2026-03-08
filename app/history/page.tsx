import { JobTable } from "@/components/job-table";
import {
  COUNTRIES,
  OUTPUT_LANGUAGES,
  PLATFORMS,
  RESOLUTIONS,
} from "@/lib/constants";
import { listJobs } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getUiLanguage } from "@/lib/ui-language";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const language = await getUiLanguage();
  const jobs = listJobs({
    search: typeof params.search === "string" ? params.search : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    platform: typeof params.platform === "string" ? params.platform : undefined,
    country: typeof params.country === "string" ? params.country : undefined,
    language: typeof params.marketLanguage === "string" ? params.marketLanguage : undefined,
    resolution: typeof params.resolution === "string" ? params.resolution : undefined,
    dateFrom: typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
  });

  return (
    <div className="stack gap-24">
      <section className="panel">
        <p className="eyebrow">{t(language, "navHistory")}</p>
        <h2>{t(language, "historyTitle")}</h2>
        <form className="filter-grid" method="get">
          <input defaultValue={typeof params.search === "string" ? params.search : ""} name="search" placeholder={language === "zh" ? "搜索商品名 / SKU" : "Search product / SKU"} />
          <select defaultValue={typeof params.platform === "string" ? params.platform : ""} name="platform">
            <option value="">{language === "zh" ? "全部平台" : "All platforms"}</option>
            {PLATFORMS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label[language]}
              </option>
            ))}
          </select>
          <select defaultValue={typeof params.country === "string" ? params.country : ""} name="country">
            <option value="">{language === "zh" ? "全部国家" : "All countries"}</option>
            {COUNTRIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label[language]}
              </option>
            ))}
          </select>
          <select defaultValue={typeof params.marketLanguage === "string" ? params.marketLanguage : ""} name="marketLanguage">
            <option value="">{language === "zh" ? "全部语言" : "All languages"}</option>
            {OUTPUT_LANGUAGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label[language]}
              </option>
            ))}
          </select>
          <select defaultValue={typeof params.resolution === "string" ? params.resolution : ""} name="resolution">
            <option value="">{language === "zh" ? "全部分辨率" : "All resolutions"}</option>
            {RESOLUTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label[language]}
              </option>
            ))}
          </select>
          <input defaultValue={typeof params.dateFrom === "string" ? params.dateFrom : ""} name="dateFrom" type="date" />
          <input defaultValue={typeof params.dateTo === "string" ? params.dateTo : ""} name="dateTo" type="date" />
          <button className="primary-button" type="submit">
            {t(language, "filters")}
          </button>
        </form>
      </section>
      <section className="panel">{jobs.length ? <JobTable jobs={jobs} language={language} /> : <p>{t(language, "emptyJobs")}</p>}</section>
    </div>
  );
}
