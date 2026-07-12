import {
  Award,
  Trophy,
  Medal,
  Star,
  Crown,
  Flame,
  Zap,
  Target,
  Leaf,
  Heart,
  ShieldCheck,
  Rocket,
  Gem,
  ThumbsUp,
  Sparkles,
  TrendingUp,
  HandHeart,
  BookOpenCheck,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Curated set of icons a badge may use; unknown names fall back to Award. */
export const BADGE_ICON_MAP: Record<string, LucideIcon> = {
  Award,
  Trophy,
  Medal,
  Star,
  Crown,
  Flame,
  Zap,
  Target,
  Leaf,
  Heart,
  ShieldCheck,
  Rocket,
  Gem,
  ThumbsUp,
  Sparkles,
  TrendingUp,
  HandHeart,
  BookOpenCheck,
};

export const BADGE_ICON_OPTIONS = Object.keys(BADGE_ICON_MAP).map((k) => ({ label: k, value: k }));

export function BadgeIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && BADGE_ICON_MAP[name]) || Award;
  return <Icon className={cn("size-5", className)} />;
}

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
