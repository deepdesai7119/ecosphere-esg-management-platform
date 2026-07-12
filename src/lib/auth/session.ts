import { redirect } from "next/navigation";
import { auth } from "./auth";
import { can, type Capability, type SessionActor } from "@/lib/permissions";
import type { Role } from "@prisma/client";

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
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
    departmentId: session.user.departmentId,
    organizationId: session.user.organizationId,
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
