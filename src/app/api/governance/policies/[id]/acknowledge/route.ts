import { apiOk, handle, requireApiCapability } from "@/lib/api";
import { acknowledgePolicy } from "@/server/services/policy.service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiCapability("policy.acknowledge");
    const { id } = await params;
    const ack = await acknowledgePolicy(id, user.id);
    return apiOk(ack);
  });
}