import { requireUser } from "@/lib/auth/session";
import { TypedReport, type ReportSearchParams } from "../_components/typed-report";

export const metadata = { title: "Governance Report" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<ReportSearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  return (
    <TypedReport
      type="governance"
      title="Governance Report"
      description="Policies, acknowledgement rates, audits, compliance issues, overdue items and severity analysis."
      user={user}
      searchParams={sp}
    />
  );
}
