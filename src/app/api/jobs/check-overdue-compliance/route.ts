import { apiError, apiOk, forbidden } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { getPrimaryOrganization } from "@/server/services/config.service";
import { runOverdueSweep } from "@/server/services/compliance.service";

/**
 * Overdue-compliance sweep. Authorised either by:
 *   - `Authorization: Bearer <CRON_SECRET>` (scheduled cron), or
 *   - a signed-in user with the `compliance.manage` capability (manual button).
 */
async function authorize(req: Request): Promise<string | null> {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  if (secret && header === `Bearer ${secret}`) {
    const org = await getPrimaryOrganization();
    return org?.id ?? null;
  }
  const user = await getCurrentUser();
  if (user && can(user.role, "compliance.manage")) {
    return user.organizationId;
  }
  return null;
}

async function run(req: Request) {
  try {
    const organizationId = await authorize(req);
    if (organizationId === null) throw forbidden("Not authorised to run this job.");
    const result = await runOverdueSweep(organizationId);
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  return run(req);
}

// Allow GET for simple cron providers.
export async function GET(req: Request) {
  return run(req);
}
