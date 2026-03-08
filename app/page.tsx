import Link from "next/link";

import { JobTable } from "@/components/job-table";
import { StatCard } from "@/components/stat-card";
import { getDashboardStats, listRecentJobs } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getUiLanguage } from "@/lib/ui-language";

export default async function HomePage() {
  const language = await getUiLanguage();
  const stats = getDashboardStats();
  const recentJobs = listRecentJobs(5);

  return (
    <div className="stack gap-24">
      <section className="hero panel">
        <div>
          <p className="eyebrow">AI Commerce Studio</p>
          <h2>{t(language, "heroTitle")}</h2>
          <p>{t(language, "heroSubtitle")}</p>
        </div>
        <Link className="primary-button" href="/create">
          {t(language, "quickStart")}
        </Link>
      </section>

      <section className="stats-grid">
        <StatCard label={t(language, "statsJobs")} value={stats.jobs.toString()} accent="#3b82f6" />
        <StatCard label={t(language, "statsAssets")} value={stats.assets.toString()} accent="#8b5cf6" />
        <StatCard label={t(language, "statsTemplates")} value={stats.templates.toString()} accent="#06b6d4" />
        <StatCard label={t(language, "statsMarkets")} value={stats.markets.toString()} accent="#10b981" />
      </section>

      <section className="panel">
        <div className="split-header compact">
          <div>
            <p className="eyebrow">{t(language, "recentJobs")}</p>
            <h3>{t(language, "recentJobs")}</h3>
          </div>
          <Link href="/history">{t(language, "viewAll")}</Link>
        </div>
        {recentJobs.length ? <JobTable jobs={recentJobs} language={language} /> : <p>{t(language, "emptyJobs")}</p>}
      </section>
    </div>
  );
}
