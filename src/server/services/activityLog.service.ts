import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface ActivityLogInput {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldData?: Prisma.InputJsonValue;
  newData?: Prisma.InputJsonValue;
}

/**
 * Record an audit-trail entry. Logging must never break the primary operation,
 * so failures are swallowed. Pass an existing transaction client to include the
 * log in the same transaction when desired.
 */
export async function logActivity(
  input: ActivityLogInput,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<void> {
  try {
    await client.activityLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        oldData: input.oldData,
        newData: input.newData,
      },
    });
  } catch (error) {
    console.error("[activityLog] failed to write:", error);
  }
}
