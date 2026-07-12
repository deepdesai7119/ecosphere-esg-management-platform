import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

// Icon set is shared with challenges and categories — see entity-icon.tsx.
export {
  ENTITY_ICON_MAP as BADGE_ICON_MAP,
  ENTITY_ICON_OPTIONS as BADGE_ICON_OPTIONS,
  EntityIcon as BadgeIcon,
} from "@/components/shared/entity-icon";

// ------------------------------- Difficulty -------------------------------

export const DIFFICULTY_OPTIONS = [
  { label: "Easy", value: "EASY" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Hard", value: "HARD" },
];

const DIFFICULTY_VARIANT: Record<string, BadgeVariant> = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "destructive",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <Badge variant={DIFFICULTY_VARIANT[difficulty] ?? "secondary"} className="capitalize">
      {difficulty.toLowerCase()}
    </Badge>
  );
}

// ------------------------------ Unlock metrics ----------------------------

export const UNLOCK_METRIC_OPTIONS = [
  { label: "Total XP", value: "TOTAL_XP" },
  { label: "Completed challenges", value: "COMPLETED_CHALLENGES" },
  { label: "CSR participations", value: "CSR_PARTICIPATIONS" },
  { label: "Policy acknowledgements", value: "POLICY_ACKNOWLEDGEMENTS" },
];

export const UNLOCK_METRIC_LABELS: Record<string, string> = {
  TOTAL_XP: "total XP",
  COMPLETED_CHALLENGES: "completed challenges",
  CSR_PARTICIPATIONS: "CSR participations",
  POLICY_ACKNOWLEDGEMENTS: "policy acknowledgements",
};

/** Human-readable unlock rule, e.g. "Reach 500 total XP". */
export function badgeRule(metric: string, threshold: number): string {
  return `Reach ${formatNumber(threshold, 0)} ${UNLOCK_METRIC_LABELS[metric] ?? metric}`;
}

// --------------------------- Challenge lifecycle --------------------------

export const CHALLENGE_STATUS_OPTIONS = [
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Under review", value: "UNDER_REVIEW" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];

/** Ordered pipeline stages for the lifecycle visual. */
export const LIFECYCLE_STAGES: { label: string; value: string }[] = [
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];
