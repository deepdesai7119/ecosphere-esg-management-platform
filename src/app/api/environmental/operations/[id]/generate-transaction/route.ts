import { apiOk, handle, requireApiCapability } from "@/lib/api";
import { regenerateCarbonTransaction } from "@/server/services/emission.service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiCapability("carbon.manage");
    const { id } = await params;
    const txn = await regenerateCarbonTransaction(id, user.id);
    return apiOk(txn);
  });
}
