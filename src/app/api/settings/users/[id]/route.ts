import { apiOk, handle, parseBody, requireApiCapability } from "@/lib/api";
import { userUpdateSchema } from "@/lib/validations/settings";
import { updateUser } from "@/server/services/user.service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireApiCapability("user.manage");
    const { id } = await params;
    const body = await parseBody(req, userUpdateSchema);
    const updated = await updateUser(id, body);
    return apiOk(updated);
  });
}
