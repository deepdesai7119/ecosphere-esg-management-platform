import { z } from "zod";

/** Report types the service can dispatch to. */
export const REPORT_TYPES = [
  "environmental",
  "social",
  "governance",
  "esg-summary",
  "custom",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

/** Export file formats. */
export const EXPORT_FORMATS = ["csv", "excel", "pdf"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** Optional string that treats "" as absent (query params arrive as strings). */
const optionalStr = z
  .string()
  .optional()
  .transform((v) => (v == null || v.trim() === "" ? undefined : v.trim()));

/** Shared filter query — read from URL search params on both preview & export. */
export const reportQuerySchema = z.object({
  type: z.enum(REPORT_TYPES),
  departmentId: optionalStr,
  from: optionalStr,
  to: optionalStr,
  module: optionalStr,
  employeeId: optionalStr,
  challengeId: optionalStr,
  esgCategory: optionalStr,
});
export type ReportQuery = z.infer<typeof reportQuerySchema>;

/** Export query = report query + a format. */
export const exportQuerySchema = reportQuerySchema.extend({
  format: z.enum(EXPORT_FORMATS),
});
export type ExportQuery = z.infer<typeof exportQuerySchema>;

/** Coerce a "yyyy-MM-dd" (or ISO) string to a start-of-range Date, or undefined. */
export function coerceFrom(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Coerce a "yyyy-MM-dd" (or ISO) string to an end-of-day Date, or undefined. */
export function coerceTo(value?: string): Date | undefined {
  if (!value) return undefined;
  // Plain date -> include the whole day.
  const raw = value.length <= 10 ? `${value}T23:59:59.999` : value;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
