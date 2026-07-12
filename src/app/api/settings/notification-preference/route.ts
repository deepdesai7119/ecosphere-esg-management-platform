import { apiOk, handle, parseBody, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notificationPrefSchema } from "@/lib/validations/settings";

export async function GET() {
  return handle(async () => {
    const user = await requireApiUser();
    const pref = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    return apiOk(pref);
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await requireApiUser();
    const body = await parseBody(req, notificationPrefSchema);
    const pref = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...body },
      update: body,
    });
    return apiOk(pref);
  });
}
