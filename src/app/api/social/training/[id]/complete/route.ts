import { apiOk, handle, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiUser();
    const { id } = await params;
    const completion = await prisma.trainingCompletion.upsert({
      where: { trainingId_employeeId: { trainingId: id, employeeId: user.id } },
      update: { completionPercentage: 100, status: "COMPLETED", completedAt: new Date() },
      create: {
        trainingId: id,
        employeeId: user.id,
        completionPercentage: 100,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    return apiOk(completion);
  });
}
