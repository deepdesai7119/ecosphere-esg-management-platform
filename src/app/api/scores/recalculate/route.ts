import { apiOk, handle, requireApiCapability } from "@/lib/api";
import { recalculateAndPersistScores } from "@/server/services/score.service";

export async function POST() {
  return handle(async () => {
    const user = await requireApiCapability("score.recalculate");
    const results = await recalculateAndPersistScores(user.organizationId, user.id);
    return apiOk({ departments: results.length });
  });
}
