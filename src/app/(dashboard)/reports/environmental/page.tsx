import { requireUser } from "@/lib/auth/session";
import { TypedReport, type ReportSearchParams } from "../_components/typed-report";

export const metadata = { title: "Environmental Report" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<ReportSearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  return (
    <TypedReport
      type="environmental"
      title="Environmental Report"
      description="Carbon emissions, scope breakdown, department comparison, trends and goal performance."
      user={user}
      searchParams={sp}
    />
  );
}
