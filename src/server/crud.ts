/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextResponse } from "next/server";
import type { ZodType } from "zod";
import {
  apiOk,
  handle,
  notFound,
  parseBody,
  requireApiCapability,
  requireApiUser,
} from "@/lib/api";
import { logActivity } from "@/server/services/activityLog.service";
import type { Capability } from "@/lib/permissions";

/**
 * Minimal shape of a Prisma model delegate used by the generic CRUD helpers.
 * Kept loose on purpose so a single helper can serve every simple resource.
 */
export interface CrudDelegate {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any | null>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
}

interface ListOptions {
  delegate: CrudDelegate;
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  /** When true, do not auto-scope by organizationId (model has no such field). */
  unscoped?: boolean;
}

/** List records for the current organisation. */
export function crudList(opts: ListOptions): Promise<NextResponse> {
  return handle(async () => {
    const user = await requireApiUser();
    const items = await opts.delegate.findMany({
      where: opts.unscoped ? opts.where : { organizationId: user.organizationId, ...(opts.where ?? {}) },
      orderBy: opts.orderBy ?? { createdAt: "desc" },
      ...(opts.include ? { include: opts.include } : {}),
      ...(opts.select ? { select: opts.select } : {}),
    });
    return apiOk(items);
  });
}

interface CreateOptions<T> {
  req: Request;
  delegate: CrudDelegate;
  capability: Capability;
  schema: ZodType<T>;
  entity: string;
  /** Transform validated input → Prisma create data. */
  transform?: (data: T, user: { id: string; organizationId: string; departmentId: string | null }) => Record<string, unknown>;
  unscoped?: boolean;
}

export function crudCreate<T>(opts: CreateOptions<T>): Promise<NextResponse> {
  return handle(async () => {
    const user = await requireApiCapability(opts.capability);
    const input = await parseBody(opts.req, opts.schema);
    const data = opts.transform
      ? opts.transform(input, user)
      : (input as Record<string, unknown>);
    const created = await opts.delegate.create({
      data: opts.unscoped ? data : { organizationId: user.organizationId, ...data },
    });
    await logActivity({
      organizationId: user.organizationId,
      userId: user.id,
      action: `${opts.entity}.create`,
      entityType: opts.entity,
      entityId: created.id,
    });
    return apiOk(created, { status: 201 });
  });
}

interface UpdateOptions<T> {
  req: Request;
  id: string;
  delegate: CrudDelegate;
  capability: Capability;
  schema: ZodType<T>;
  entity: string;
  transform?: (data: T) => Record<string, unknown>;
}

export function crudUpdate<T>(opts: UpdateOptions<T>): Promise<NextResponse> {
  return handle(async () => {
    const user = await requireApiCapability(opts.capability);
    const existing = await opts.delegate.findUnique({ where: { id: opts.id } });
    if (!existing) throw notFound(`${opts.entity} not found.`);
    const input = await parseBody(opts.req, opts.schema);
    const data = opts.transform ? opts.transform(input) : (input as Record<string, unknown>);
    const updated = await opts.delegate.update({ where: { id: opts.id }, data });
    await logActivity({
      organizationId: user.organizationId,
      userId: user.id,
      action: `${opts.entity}.update`,
      entityType: opts.entity,
      entityId: opts.id,
    });
    return apiOk(updated);
  });
}

interface DeleteOptions {
  id: string;
  delegate: CrudDelegate;
  capability: Capability;
  entity: string;
}

export function crudDelete(opts: DeleteOptions): Promise<NextResponse> {
  return handle(async () => {
    const user = await requireApiCapability(opts.capability);
    const existing = await opts.delegate.findUnique({ where: { id: opts.id } });
    if (!existing) throw notFound(`${opts.entity} not found.`);
    await opts.delegate.delete({ where: { id: opts.id } });
    await logActivity({
      organizationId: user.organizationId,
      userId: user.id,
      action: `${opts.entity}.delete`,
      entityType: opts.entity,
      entityId: opts.id,
    });
    return apiOk({ id: opts.id });
  });
}
