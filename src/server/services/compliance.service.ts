import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/api";
import { logActivity } from "./activityLog.service";
import { notify, notifyManagers } from "./notification.service";
import { computeOverdue } from "@/lib/esg/calculations";
import type { ComplianceStatus, Severity } from "@prisma/client";

export { computeOverdue };

export interface CreateComplianceInput {
  organizationId: string;
  auditId?: string | null;
  departmentId?: string | null;
  title: string;
  description?: string | null;
  severity: Severity;
  ownerId: string; // mandatory
  dueDate: Date; // mandatory
}

export async function createComplianceIssue(input: CreateComplianceInput, actorId: string) {
  const isOverdue = computeOverdue(input.dueDate, "OPEN");
  const issue = await prisma.complianceIssue.create({
    data: {
      organizationId: input.organizationId,
      auditId: input.auditId ?? null,
      departmentId: input.departmentId ?? null,
      title: input.title,
      description: input.description ?? null,
      severity: input.severity,
      ownerId: input.ownerId,
      dueDate: input.dueDate,
      status: "OPEN",
      isOverdue,
    },
  });

  await logActivity({
    organizationId: input.organizationId,
    userId: actorId,
    action: "compliance.create",
    entityType: "ComplianceIssue",
    entityId: issue.id,
    newData: { severity: input.severity, ownerId: input.ownerId },
  });

  // Notify the owner and all ESG managers.
  await notify({
    organizationId: input.organizationId,
    userId: input.ownerId,
    type: "COMPLIANCE_ASSIGNED",
    title: `Compliance issue assigned: ${issue.title}`,
    message: `You have been assigned a ${input.severity} severity compliance issue: "${issue.title}".`,
    entityType: "ComplianceIssue",
    entityId: issue.id,
  });
  await notifyManagers(input.organizationId, {
    type: "COMPLIANCE_ASSIGNED",
    title: `New compliance issue: ${issue.title}`,
    message: `A ${input.severity} severity compliance issue was raised: "${issue.title}".`,
    entityType: "ComplianceIssue",
    entityId: issue.id,
  });

  return issue;
}

/** Update status / resolution of an issue and re-evaluate overdue. */
export async function updateComplianceIssue(params: {
  id: string;
  status?: ComplianceStatus;
  severity?: Severity;
  ownerId?: string;
  dueDate?: Date | null;
  resolutionNotes?: string | null;
  actorId: string;
}) {
  const existing = await prisma.complianceIssue.findUnique({ where: { id: params.id } });
  if (!existing) throw new HttpError(404, "Compliance issue not found.");

  const status = params.status ?? existing.status;
  const dueDate = params.dueDate === undefined ? existing.dueDate : params.dueDate;
  const resolved = status === "RESOLVED" || status === "CLOSED";

  const updated = await prisma.complianceIssue.update({
    where: { id: params.id },
    data: {
      status,
      severity: params.severity ?? existing.severity,
      ownerId: params.ownerId ?? existing.ownerId,
      dueDate,
      resolutionNotes: params.resolutionNotes ?? existing.resolutionNotes,
      resolvedAt: resolved && !existing.resolvedAt ? new Date() : existing.resolvedAt,
      isOverdue: computeOverdue(dueDate, status),
    },
  });

  await logActivity({
    organizationId: existing.organizationId,
    userId: params.actorId,
    action: "compliance.update",
    entityType: "ComplianceIssue",
    entityId: existing.id,
    oldData: { status: existing.status },
    newData: { status },
  });

  return updated;
}

/**
 * Sweep for newly-overdue issues, flag them and notify owners + managers.
 * Invoked by the protected cron route and the manual "Run Compliance Check".
 */
export async function runOverdueSweep(organizationId?: string) {
  const now = new Date();
  const candidates = await prisma.complianceIssue.findMany({
    where: {
      ...(organizationId ? { organizationId } : {}),
      status: { in: ["OPEN", "IN_PROGRESS"] },
      dueDate: { lt: now },
      isOverdue: false,
    },
  });

  let flagged = 0;
  for (const issue of candidates) {
    await prisma.complianceIssue.update({
      where: { id: issue.id },
      data: { isOverdue: true },
    });
    flagged += 1;

    if (issue.ownerId) {
      await notify({
        organizationId: issue.organizationId,
        userId: issue.ownerId,
        type: "COMPLIANCE_OVERDUE",
        title: `Compliance issue overdue: ${issue.title}`,
        message: `The compliance issue "${issue.title}" is now overdue. Please take action.`,
        entityType: "ComplianceIssue",
        entityId: issue.id,
      });
    }
    await notifyManagers(issue.organizationId, {
      type: "COMPLIANCE_OVERDUE",
      title: `Overdue compliance issue: ${issue.title}`,
      message: `"${issue.title}" has passed its due date without resolution.`,
      entityType: "ComplianceIssue",
      entityId: issue.id,
    });
  }

  return { checked: candidates.length, flagged };
}
