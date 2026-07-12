import type { ComplianceStatus } from "@prisma/client";
import { round2 } from "./scoring";

/**
 * Pure calculation helpers with no database or framework imports, so they can
 * be unit-tested in isolation. The service layer re-exports these.
 */

/** co2e (kg) = activity quantity × emission factor value. */
export function computeCo2eKg(quantity: number, factorValue: number): number {
  return round2(quantity * factorValue);
}

/** An issue is overdue when it is still open/in-progress past its due date. */
export function computeOverdue(
  dueDate: Date | null | undefined,
  status: ComplianceStatus,
  now: Date = new Date(),
): boolean {
  if (!dueDate) return false;
  if (status === "RESOLVED" || status === "CLOSED") return false;
  return dueDate.getTime() < now.getTime();
}
