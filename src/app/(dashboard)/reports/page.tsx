import Link from "next/link";
import { Leaf, Users, Landmark, FileBarChart, SlidersHorizontal, ArrowRight } from "lucide-react";
import { requireCapability } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Reports" };

const REPORTS = [
  { href: "/reports/environmental", title: "Environmental Report", desc: "Emissions, scopes, department breakdown, trends & goal performance.", icon: Leaf, color: "text-env" },
  { href: "/reports/social", title: "Social Report", desc: "CSR participation, training completion, diversity & points awarded.", icon: Users, color: "text-social" },
  { href: "/reports/governance", title: "Governance Report", desc: "Policies, acknowledgement %, audits, compliance & severity.", icon: Landmark, color: "text-gov" },
  { href: "/reports/esg-summary", title: "ESG Summary", desc: "All four scores, department ranking, period & critical warnings.", icon: FileBarChart, color: "text-foreground" },
  { href: "/reports/custom", title: "Custom Report Builder", desc: "Filter by department, date, module, employee, challenge & category.", icon: SlidersHorizontal, color: "text-game" },
];

export default async function ReportsPage() {
  await requireCapability("report.generate");
  return (
    <>
      <PageHeader title="Reports" description="Generate and export ESG analytics as PDF, Excel or CSV." />
      <ModuleTabs groupHref="/reports" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col gap-2 py-5">
                <r.icon className={`size-5 ${r.color}`} />
                <p className="font-semibold">{r.title}</p>
                <p className="flex-1 text-sm text-muted-foreground">{r.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Generate <ArrowRight className="size-3.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
