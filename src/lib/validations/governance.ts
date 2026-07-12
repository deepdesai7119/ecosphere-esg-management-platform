import { z } from "zod";

const POLICY_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const AUDIT_TYPE = ["INTERNAL", "EXTERNAL", "VENDOR", "REGULATORY"] as const;
const AUDIT_STATUS = ["PLANNED", "IN_PROGRESS", "UNDER_REVIEW", "COMPLETED"] as const;
const SEVERITY = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const COMPLIANCE_STATUS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

const optionalId = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v));

// ------------------------------- Policies -------------------------------

export const policyCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string().min(1, "Code is required"),
  version: z.string().default("1.0"),
  description: z.string().optional(),
  departmentId: optionalId,
  effectiveDate: z.coerce.date().optional(),
  acknowledgementDueDate: z.coerce.date().optional(),
  acknowledgementRequired: z.boolean().default(true),
  status: z.enum(POLICY_STATUS).default("DRAFT"),
});
export const policyUpdateSchema = policyCreateSchema.partial();

// -------------------------------- Audits --------------------------------

export const auditCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  auditType: z.enum(AUDIT_TYPE).default("INTERNAL"),
  auditorId: optionalId,
  departmentId: optionalId,
  auditDate: z.coerce.date().optional(),
  findingsSummary: z.string().optional(),
  score: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(AUDIT_STATUS).default("PLANNED"),
});
export const auditUpdateSchema = auditCreateSchema.partial();

// ------------------------------ Compliance ------------------------------

export const complianceCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  auditId: optionalId,
  departmentId: optionalId,
  severity: z.enum(SEVERITY),
  ownerId: z.string().min(1, "Owner is required"),
  dueDate: z.coerce.date(),
});

export const complianceUpdateSchema = z.object({
  status: z.enum(COMPLIANCE_STATUS).optional(),
  severity: z.enum(SEVERITY).optional(),
  ownerId: z.string().min(1).optional(),
  dueDate: z.coerce.date().optional(),
  resolutionNotes: z.string().optional(),
});
