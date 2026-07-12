import { z } from "zod";
import { apiOk, handle, parseBody, requireApiUser } from "@/lib/api";
import { markRead } from "@/server/services/notification.service";

const schema = z.object({ id: z.string().min(1) });

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireApiUser();
    const { id } = await parseBody(req, schema);
    await markRead(user.id, id);
    return apiOk({ id });
  });
}
