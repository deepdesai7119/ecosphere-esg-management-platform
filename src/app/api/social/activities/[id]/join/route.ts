import { apiOk, handle, requireApiCapability } from "@/lib/api";
import { joinCsrActivity } from "@/server/services/csr.service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiCapability("csr.join");
    const { id } = await params;
    const participation = await joinCsrActivity(id, user.id);
    return apiOk(participation, { status: 201 });
  });
}
