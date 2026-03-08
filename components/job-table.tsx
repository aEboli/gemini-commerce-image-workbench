import Link from "next/link";

import type { JobRecord, UiLanguage } from "@/lib/types";

function statusLabel(language: UiLanguage, status: string) {
  const labels = {
    zh: { queued: "排队中", processing: "生成中", completed: "已完成", partial: "部分完成", failed: "失败" },
    en: { queued: "Queued", processing: "Processing", completed: "Completed", partial: "Partial", failed: "Failed" },
  } as const;
  return labels[language][status as keyof (typeof labels)["zh"]] ?? status;
}

export function JobTable({ jobs, language }: { jobs: JobRecord[]; language: UiLanguage }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{language === "zh" ? "商品" : "Product"}</th>
            <th>SKU</th>
            <th>{language === "zh" ? "平台" : "Platform"}</th>
            <th>{language === "zh" ? "市场" : "Market"}</th>
            <th>{language === "zh" ? "状态" : "Status"}</th>
            <th>{language === "zh" ? "时间" : "Created"}</th>
            <th>{language === "zh" ? "操作" : "Open"}</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.productName}</td>
              <td>{job.sku || "—"}</td>
              <td>{job.platform}</td>
              <td>
                {job.country} / {job.language}
              </td>
              <td>{statusLabel(language, job.status)}</td>
              <td>{new Date(job.createdAt).toLocaleString()}</td>
              <td>
                <Link href={`/jobs/${job.id}`}>{language === "zh" ? "查看" : "Open"}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
