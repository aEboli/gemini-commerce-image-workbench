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
  const copy =
    language === "zh"
      ? {
          featureTitle: "团队创作面板",
          featureCards: [
            { title: "批量出图", description: "一次上传多张商品图，按类型、尺寸和数量自动拆分任务。" },
            { title: "多市场适配", description: "按国家、语言和平台自动命中文案与视觉模板。" },
            { title: "模板驱动", description: "默认模板和自定义模板都能参与实时命中与生成。" },
            { title: "快速复用", description: "从历史任务继续生成，持续迭代商品视觉资产。" },
          ],
          quickActionsTitle: "快捷入口",
          quickActions: [
            { href: "/create", title: "新建任务", description: "开始新一轮批量生成" },
            { href: "/history", title: "查看历史", description: "筛选、复用和下载结果" },
            { href: "/templates", title: "管理模板", description: "维护平台与市场模板" },
            { href: "/settings", title: "系统设置", description: "配置 API、中转站和默认参数" },
          ],
          workflowTitle: "推荐工作流",
          workflowSteps: [
            "先在设置页确认 API Key、Base URL 和默认模型。",
            "在创作台上传商品图，实时确认预览和模板命中结果。",
            "生成后从历史页继续筛选、复用和下载素材。",
          ],
          helperTitle: "当前站点能力",
          helperBody: "支持局域网多人协作、批量出图、模板匹配预览与中转站接入。",
        }
      : {
          featureTitle: "Team workspace",
          featureCards: [
            { title: "Batch generation", description: "Upload multiple products and expand into types, sizes, and quantities automatically." },
            { title: "Market-aware output", description: "Match templates automatically by country, language, and platform." },
            { title: "Template-driven", description: "Default and custom templates participate in live matching and generation." },
            { title: "Fast reuse", description: "Resume from history and keep iterating product visuals quickly." },
          ],
          quickActionsTitle: "Quick access",
          quickActions: [
            { href: "/create", title: "New job", description: "Start a fresh batch" },
            { href: "/history", title: "Open history", description: "Filter, reuse, and download results" },
            { href: "/templates", title: "Manage templates", description: "Maintain market and platform templates" },
            { href: "/settings", title: "System settings", description: "Configure API, relay, and defaults" },
          ],
          workflowTitle: "Suggested workflow",
          workflowSteps: [
            "Confirm the API key, base URL, and default models in Settings first.",
            "Upload product images in the studio and verify preview plus template matches live.",
            "Use History to filter, rerun, and download production-ready assets.",
          ],
          helperTitle: "Current capabilities",
          helperBody: "Built for LAN teams with batch generation, template match preview, and relay-compatible Gemini access.",
        };

  return (
    <div className="stack gap-24">
      <section className="hero panel overview-hero">
        <div className="overview-hero-main">
          <p className="eyebrow">AI Commerce Studio</p>
          <h2>{t(language, "heroTitle")}</h2>
          <p>{t(language, "heroSubtitle")}</p>
          <div className="button-row">
            <Link className="primary-button" href="/create">
              {t(language, "quickStart")}
            </Link>
            <Link className="ghost-button" href="/history">
              {t(language, "viewAll")}
            </Link>
          </div>
        </div>
        <div className="overview-hero-side">
          <div className="split-header compact">
            <div>
              <p className="eyebrow">{copy.featureTitle}</p>
              <h3>{copy.helperTitle}</h3>
            </div>
          </div>
          <p className="helper">{copy.helperBody}</p>
          <div className="hero-feature-grid">
            {copy.featureCards.map((item) => (
              <article className="hero-feature-card" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label={t(language, "statsJobs")} value={stats.jobs.toString()} accent="#3b82f6" />
        <StatCard label={t(language, "statsAssets")} value={stats.assets.toString()} accent="#8b5cf6" />
        <StatCard label={t(language, "statsTemplates")} value={stats.templates.toString()} accent="#06b6d4" />
        <StatCard label={t(language, "statsMarkets")} value={stats.markets.toString()} accent="#10b981" />
      </section>

      <section className="overview-grid">
        <div className="panel overview-main-panel">
          <div className="split-header compact">
            <div>
              <p className="eyebrow">{t(language, "recentJobs")}</p>
              <h3>{t(language, "recentJobs")}</h3>
            </div>
            <Link href="/history">{t(language, "viewAll")}</Link>
          </div>
          {recentJobs.length ? <JobTable jobs={recentJobs} language={language} /> : <p>{t(language, "emptyJobs")}</p>}
        </div>

        <aside className="overview-side stack gap-24">
          <section className="panel">
            <div className="split-header compact">
              <div>
                <p className="eyebrow">{copy.quickActionsTitle}</p>
                <h3>{copy.quickActionsTitle}</h3>
              </div>
            </div>
            <div className="quick-link-grid">
              {copy.quickActions.map((action) => (
                <Link className="quick-link-card" href={action.href} key={action.href}>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="split-header compact">
              <div>
                <p className="eyebrow">{copy.workflowTitle}</p>
                <h3>{copy.workflowTitle}</h3>
              </div>
            </div>
            <ol className="workflow-list">
              {copy.workflowSteps.map((step) => (
                <li className="workflow-step" key={step}>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </section>
    </div>
  );
}
