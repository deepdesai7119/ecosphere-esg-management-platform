import bcrypt from "bcryptjs";
import { Prisma, type Role, type RecordStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/api";
import { DEMO_PASSWORD } from "@/lib/constants";

/** Fields safe to return to the client — never includes `passwordHash`. */
const userSafeSelect = {
  id: true,
  organizationId: true,
  departmentId: true,
  name: true,
  email: true,
  role: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export interface CreateUserInput {
  organizationId: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string | null;
  password?: string | null;
}

/**
 * Create a user (ACTIVE) with a hashed password (defaults to the demo password)
 * and a default notification-preference row. Throws 409 on duplicate email.
 */
export async function createUser(input: CreateUserInput) {
  const passwordHash = await bcrypt.hash(input.password || DEMO_PASSWORD, 10);
  try {
    return await prisma.user.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        email: input.email,
        role: input.role,
        departmentId: input.departmentId ?? null,
        passwordHash,
        status: "ACTIVE",
        notificationPreference: { create: {} },
      },
      select: userSafeSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "A user with this email already exists.");
    }
    throw error;
  }
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  departmentId?: string | null;
  status?: RecordStatus;
}

/** Patch mutable user fields. Only provided keys are written. */
export async function updateUser(id: string, input: UpdateUserInput) {
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new HttpError(404, "User not found.");

  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.role !== undefined) data.role = input.role;
  if (input.status !== undefined) data.status = input.status;
  if (input.departmentId !== undefined) {
    data.department = input.departmentId
      ? { connect: { id: input.departmentId } }
      : { disconnect: true };
  }

  return prisma.user.update({ where: { id }, data, select: userSafeSelect });
}

/** Reset a user's password back to the demo password. */
export async function resetUserPassword(id: string) {
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new HttpError(404, "User not found.");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.update({ where: { id }, data: { passwordHash }, select: userSafeSelect });
}
