import { format, formatDistanceToNow, isValid } from "date-fns";

type DateLike = Date | string | number | null | undefined;

function toDate(value: DateLike): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isValid(d) ? d : null;
}

export function formatDate(value: DateLike, pattern = "dd MMM yyyy"): string {
  const d = toDate(value);
  return d ? format(d, pattern) : "—";
}

export function formatDateTime(value: DateLike): string {
  const d = toDate(value);
  return d ? format(d, "dd MMM yyyy, HH:mm") : "—";
}

export function formatRelative(value: DateLike): string {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}

/** Coerce Prisma Decimal | number | string to a JS number safely. */
export function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

export function formatNumber(value: unknown, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(toNumber(value));
}

export function formatPercent(value: unknown, digits = 0): string {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(toNumber(value))}%`;
}

/** Format kg of CO2e, auto-switching to tonnes above 1,000 kg. */
export function formatCo2(kg: unknown): string {
  const n = toNumber(kg);
  if (Math.abs(n) >= 1000) {
    return `${formatNumber(n / 1000, 2)} tCO₂e`;
  }
  return `${formatNumber(n, 1)} kgCO₂e`;
}

export function formatTonnes(tonnes: unknown): string {
  return `${formatNumber(tonnes, 1)} t`;
}

export function formatPoints(value: unknown): string {
  return `${formatNumber(value, 0)}`;
}

/** Two-letter initials for avatars. */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Turn an ENUM_VALUE into "Enum value" for display. */
export function humanizeEnum(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
