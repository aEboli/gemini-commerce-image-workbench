import { notFound } from "next/navigation";

import { JobDetailsClient } from "@/components/job-details-client";
import { getJobDetails } from "@/lib/db";
import { getUiLanguage } from "@/lib/ui-language";

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const details = getJobDetails(id);
  if (!details) {
    notFound();
  }

  const language = await getUiLanguage();
  return <JobDetailsClient initialDetails={details} language={language} />;
}
