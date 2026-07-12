import { requireUser } from "@/lib/auth/session";
import { TypedReport, type ReportSearchParams } from "../_components/typed-report";

export const metadata = { title: "ESG Summary" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<ReportSearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  return (
    <TypedReport
      type="esg-summary"
      title="ESG Summary Report"
      description="Environmental, social, governance and overall scores with department ranking and critical warnings."
      user={user}
      searchParams={sp}
    />
  );
}
