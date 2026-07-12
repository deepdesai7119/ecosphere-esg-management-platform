import { prisma } from "@/lib/db";
import { crudList } from "@/server/crud";

export async function GET() {
  return crudList({
    delegate: prisma.carbonTransaction,
    orderBy: { transactionDate: "desc" },
    include: {
      department: { select: { name: true } },
      emissionFactor: { select: { name: true } },
    },
  });
}
