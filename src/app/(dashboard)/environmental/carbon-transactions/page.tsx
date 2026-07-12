import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { TransactionsClient } from "./transactions-client";

export const metadata = { title: "Carbon Transactions" };
export const dynamic = "force-dynamic";

export default async function CarbonTransactionsPage() {
  const user = await requireUser();
  const txns = await prisma.carbonTransaction.findMany({
    where: { organizationId: user.organizationId },
    include: {
      department: { select: { name: true } },
      emissionFactor: { select: { name: true } },
    },
    orderBy: { transactionDate: "desc" },
    take: 300,
  });

  return (
    <>
      <PageHeader
        title="Carbon Transactions"
        description="Auto-generated from operations across Purchase, Manufacturing, Fleet and Expenses."
        accentClassName="text-env"
        breadcrumbs={[{ label: "Environmental", href: "/environmental" }, { label: "Carbon Transactions" }]}
      />
      <ModuleTabs groupHref="/environmental" module="environmental" />
      <TransactionsClient data={JSON.parse(JSON.stringify(txns))} />
    </>
  );
}
