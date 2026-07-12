/**
 * Shared, server-safe constants: module theming, enum label maps and
 * status → badge-variant mappings used across the UI.
 */

export type ModuleKey = "environmental" | "social" | "governance" | "gamification";

export interface ModuleMeta {
  key: ModuleKey;
  label: string;
  /** Tailwind utility color name (see brand tokens in globals.css). */
  color: "env" | "social" | "gov" | "game";
  /** Solid background + on-color text classes. */
  solid: string;
  /** Tinted background + colored text (theme-safe via /opacity). */
  tint: string;
  /** Colored text only. */
  text: string;
  /** Colored border. */
  border: string;
  /** Hex for charts. */
  hex: string;
}

export const MODULES: Record<ModuleKey, ModuleMeta> = {
  environmental: {
    key: "environmental",
    label: "Environmental",
    color: "env",
    solid: "bg-env text-white",
    tint: "bg-env/10 text-env-dark dark:text-env",
    text: "text-env",
    border: "border-env/30",
    hex: "#16a34a",
  },
  social: {
    key: "social",
    label: "Social",
    color: "social",
    solid: "bg-social text-white",
    tint: "bg-social/10 text-social-dark dark:text-social",
    text: "text-social",
    border: "border-social/30",
    hex: "#2563eb",
  },
  governance: {
    key: "governance",
    label: "Governance",
    color: "gov",
    solid: "bg-gov text-white",
    tint: "bg-gov/10 text-gov-dark dark:text-gov",
    text: "text-gov",
    border: "border-gov/30",
    hex: "#7c3aed",
  },
  gamification: {
    key: "gamification",
    label: "Gamification",
    color: "game",
    solid: "bg-game text-white",
    tint: "bg-game/10 text-game-dark dark:text-game",
    text: "text-game",
    border: "border-game/30",
    hex: "#f97316",
  },
};

export const CHART_COLORS = ["#16a34a", "#2563eb", "#7c3aed", "#f97316", "#0891b2", "#db2777"];

export const SCOPE_LABELS: Record<string, string> = {
  SCOPE_1: "Scope 1 · Direct",
  SCOPE_2: "Scope 2 · Energy",
  SCOPE_3: "Scope 3 · Value chain",
};

export const ROLE_LABELS: Record<string, string> = {
  ORG_ADMIN: "Organisation Admin",
  ESG_MANAGER: "ESG Manager",
  DEPARTMENT_HEAD: "Department Head",
  EMPLOYEE: "Employee",
  AUDITOR: "Auditor",
};

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info"
  | "purple";

/** Map arbitrary status enums to a badge tone. */
export const STATUS_VARIANT: Record<string, BadgeVariant> = {
  // Generic
  ACTIVE: "success",
  INACTIVE: "secondary",
  ARCHIVED: "outline",
  DRAFT: "secondary",
  // Goals
  ON_TRACK: "success",
  AT_RISK: "warning",
  COMPLETED: "info",
  OVERDUE: "destructive",
  // Approvals
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  ACKNOWLEDGED: "success",
  // Challenge lifecycle
  UNDER_REVIEW: "purple",
  // Audit
  PLANNED: "secondary",
  IN_PROGRESS: "info",
  // Compliance
  OPEN: "destructive",
  RESOLVED: "success",
  CLOSED: "secondary",
  // Severity
  LOW: "secondary",
  MEDIUM: "warning",
  HIGH: "destructive",
  CRITICAL: "destructive",
  // Redemption
  FULFILLED: "success",
  // Policy
  PUBLISHED: "success",
};

export function statusVariant(status: string | null | undefined): BadgeVariant {
  if (!status) return "secondary";
  return STATUS_VARIANT[status] ?? "secondary";
}

export const DEMO_PASSWORD = "Demo@123";
