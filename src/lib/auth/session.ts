import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "@/lib/db";
import { can, type Capability, type SessionActor } from "@/lib/permissions";
import type { Role } from "@prisma/client";

/**
 * Single-organisation app: resolve the current organisation id from the DB
 * (deduped per request). This keeps the app working even when a session token
 * predates a database re-seed and holds a now-deleted organisation id.
 */
const resolvePrimaryOrgId = cache(async (): Promise<string | null> => {
  const org = await prisma.organization
    .findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } })
    .catch(() => null);
  return org?.id ?? null;
});

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  organizationId: string;
  avatarUrl: string | null;
}

/** Returns the current user or null (for optional-auth server code). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  // Prefer the live primary organisation id; fall back to the token's value.
  const organizationId = (await resolvePrimaryOrgId()) ?? session.user.organizationId;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
    departmentId: session.user.departmentId,
    organizationId,
    avatarUrl: session.user.avatarUrl,
  };
}

/** Server Component guard: redirects to /login when unauthenticated. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Server Component guard requiring a specific capability. */
export async function requireCapability(capability: Capability): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.role, capability)) redirect("/dashboard?denied=1");
  return user;
}

/** Server Component guard requiring one of the given roles. */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard?denied=1");
  return user;
}

export function toActor(user: CurrentUser): SessionActor {
  return { id: user.id, role: user.role, departmentId: user.departmentId };
}
