import type { ChallengeStatus } from "@prisma/client";

/**
 * Allowed challenge lifecycle transitions:
 *   DRAFT → ACTIVE → UNDER_REVIEW → COMPLETED
 * ARCHIVED may be entered from any non-archived state.
 */
const FORWARD: Record<ChallengeStatus, ChallengeStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["UNDER_REVIEW", "ARCHIVED"],
  UNDER_REVIEW: ["COMPLETED", "ACTIVE", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransition(from: ChallengeStatus, to: ChallengeStatus): boolean {
  if (from === to) return false;
  return FORWARD[from]?.includes(to) ?? false;
}

export function nextStatuses(from: ChallengeStatus): ChallengeStatus[] {
  return FORWARD[from] ?? [];
}

export function assertTransition(from: ChallengeStatus, to: ChallengeStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid challenge transition: ${from} → ${to}`);
  }
}
