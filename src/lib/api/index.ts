import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { can, type Capability } from "@/lib/permissions";

/** Domain-friendly HTTP error carrying a status code and optional details. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, details);
export const unauthorized = (message = "You must be signed in.") =>
  new HttpError(401, message);
export const forbidden = (message = "You do not have permission to do that.") =>
  new HttpError(403, message);
export const notFound = (message = "Resource not found.") => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);

/** Standard success envelope. */
export function apiOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

/** Standard error envelope. */
export function apiError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { ok: false, error: { message: error.message, details: error.details } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { ok: false, error: { message: "Validation failed.", details: error.issues } },
      { status: 400 },
    );
  }
  console.error("[api] Unhandled error:", error);
  return NextResponse.json(
    { ok: false, error: { message: "Something went wrong. Please try again." } },
    { status: 500 },
  );
}

/** Wrap a route body so any thrown error is converted to a JSON error response. */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    return apiError(error);
  }
}

/** Returns the authenticated user or throws 401. */
export async function requireApiUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

/** Returns the authenticated user, requiring a capability, or throws 401/403. */
export async function requireApiCapability(capability: Capability): Promise<CurrentUser> {
  const user = await requireApiUser();
  if (!can(user.role, capability)) throw forbidden();
  return user;
}

/** Parse and validate a JSON request body with a Zod schema. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw badRequest("Invalid JSON body.");
  }
  return schema.parse(json);
}

/** Parse and validate URL search params with a Zod schema. */
export function parseQuery<T>(req: Request, schema: ZodType<T>): T {
  const url = new URL(req.url);
  const obj: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  return schema.parse(obj);
}
