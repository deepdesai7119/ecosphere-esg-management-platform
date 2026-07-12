import { requireCapability } from "@/lib/auth/session";
import { TypedReport, type ReportSearchParams } from "../_components/typed-report";

export const metadata = { title: "Social Report" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<ReportSearchParams> }) {
  const user = await requireCapability("report.generate");
  const sp = await searchParams;
  return (
    <TypedReport
      type="social"
      title="Social Report"
      description="CSR activities, participation, training completion, diversity metrics and points awarded."
      user={user}
      searchParams={sp}
    />
  );
}
