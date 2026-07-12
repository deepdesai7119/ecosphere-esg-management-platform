import type { Role } from "@prisma/client";

/**
 * Capability-based permission model. Each capability is a coarse action that a
 * role either can or cannot perform. Department scoping (a DEPARTMENT_HEAD may
 * only act on their own department) is enforced separately by
 * {@link canActOnDepartment} inside the service layer — hiding a button is
 * never treated as security.
 */
export type Capability =
  | "settings.manage"
  | "user.manage"
  | "department.manage"
  | "category.manage"
  | "esgConfig.manage"
  | "factor.manage"
  | "product.manage"
  | "operation.manage"
  | "carbon.manage"
  | "goal.manage"
  | "csr.manage"
  | "csr.approve"
  | "csr.join"
  | "training.manage"
  | "challenge.manage"
  | "challenge.approve"
  | "challenge.join"
  | "training.complete"
  | "badge.manage"
  | "reward.manage"
  | "reward.redeem"
  | "redemption.process"
  | "policy.manage"
  | "policy.acknowledge"
  | "audit.manage"
  | "compliance.manage"
  | "score.recalculate"
  | "report.generate"
  | "notification.broadcast";

const ALL: Capability[] = [
  "settings.manage",
  "user.manage",
  "department.manage",
  "category.manage",
  "esgConfig.manage",
  "factor.manage",
  "product.manage",
  "operation.manage",
  "carbon.manage",
  "goal.manage",
  "csr.manage",
  "csr.approve",
  "csr.join",
  "training.manage",
  "challenge.manage",
  "challenge.approve",
  "challenge.join",
  "training.complete",
  "badge.manage",
  "reward.manage",
  "reward.redeem",
  "redemption.process",
  "policy.manage",
  "policy.acknowledge",
  "audit.manage",
  "compliance.manage",
  "score.recalculate",
  "report.generate",
  "notification.broadcast",
];

/**
 * Participation capabilities are for individual contributors (join a CSR
 * activity/challenge, redeem a reward, acknowledge a policy as an assignee).
 * ORG_ADMIN gets every *administrative* capability but not these — an admin
 * manages and approves engagement, they don't personally participate in it.
 */
const PARTICIPATION_ONLY: Capability[] = [
  "csr.join",
  "challenge.join",
  "training.complete",
  "reward.redeem",
  "policy.acknowledge",
];

const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  ORG_ADMIN: ALL.filter((cap) => !PARTICIPATION_ONLY.includes(cap)),
  ESG_MANAGER: [
    "category.manage",
    "factor.manage",
    "product.manage",
    "operation.manage",
    "carbon.manage",
    "goal.manage",
    "csr.manage",
    "csr.approve",
    "csr.join",
    "training.manage",
    "challenge.manage",
    "challenge.approve",
    "badge.manage",
    "reward.manage",
    "redemption.process",
    "policy.manage",
    "audit.manage",
    "compliance.manage",
    "score.recalculate",
    "report.generate",
    "notification.broadcast",
  ],
  DEPARTMENT_HEAD: [
    "goal.manage",
    "operation.manage",
    "csr.approve",
    "csr.join",
    "challenge.approve",
    "challenge.join",
    "training.complete",
    "compliance.manage",
    "policy.acknowledge",
    "report.generate",
  ],
  EMPLOYEE: [
    "csr.join",
    "challenge.join",
    "training.complete",
    "policy.acknowledge",
    "reward.redeem",
  ],
  AUDITOR: ["audit.manage", "compliance.manage", "report.generate"],
};

export interface SessionActor {
  id: string;
  role: Role;
  departmentId?: string | null;
}

/** Whether a role holds a capability at all (ignoring department scope). */
export function can(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

/** Convenience for React/server checks with a full actor. */
export function actorCan(actor: SessionActor | null | undefined, capability: Capability): boolean {
  if (!actor) return false;
  return can(actor.role, capability);
}

/**
 * Department-scoped authorisation. ORG_ADMIN / ESG_MANAGER / AUDITOR act across
 * the whole organisation; DEPARTMENT_HEAD and EMPLOYEE are limited to their own
 * department. A null target department is treated as org-wide (admins only).
 */
export function canActOnDepartment(
  actor: SessionActor,
  targetDepartmentId: string | null | undefined,
): boolean {
  if (actor.role === "ORG_ADMIN" || actor.role === "ESG_MANAGER" || actor.role === "AUDITOR") {
    return true;
  }
  // Only org-wide roles (handled above) may act on org-wide (null-department)
  // records; a department-scoped actor cannot.
  if (!targetDepartmentId) return false;
  return actor.departmentId === targetDepartmentId;
}

export function isAdmin(role: Role): boolean {
  return role === "ORG_ADMIN";
}

export function isManagerOrAbove(role: Role): boolean {
  return role === "ORG_ADMIN" || role === "ESG_MANAGER";
}

export function capabilitiesFor(role: Role): Capability[] {
  return ROLE_CAPABILITIES[role] ?? [];
}
