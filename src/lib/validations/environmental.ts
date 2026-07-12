import { z } from "zod";

const SCOPES = ["SCOPE_1", "SCOPE_2", "SCOPE_3"] as const;
const RECORD_STATUS = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;
const OPERATION_TYPES = ["PURCHASE", "MANUFACTURING", "EXPENSE", "FLEET"] as const;
const GOAL_STATUS = ["ACTIVE", "ON_TRACK", "AT_RISK", "COMPLETED", "OVERDUE"] as const;

const optionalId = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v));

export const factorCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sourceType: z.string().min(1, "Source type is required"),
  activityUnit: z.string().min(1, "Activity unit is required"),
  factorValue: z.coerce.number().positive("Factor must be positive"),
  emissionUnit: z.string().default("kgCO2e"),
  scope: z.enum(SCOPES),
  region: z.string().optional(),
  referenceYear: z.coerce.number().int().optional(),
  sourceReference: z.string().optional(),
  status: z.enum(RECORD_STATUS).optional(),
});
export const factorUpdateSchema = factorCreateSchema.partial();

export const productCreateSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  productName: z.string().min(1, "Product name is required"),
  category: z.string().optional(),
  embodiedCarbon: z.coerce.number().min(0).optional(),
  recyclablePercentage: z.coerce.number().min(0).max(100).optional(),
  renewableMaterialPercentage: z.coerce.number().min(0).max(100).optional(),
  supplierEsgRating: z.string().optional(),
  status: z.enum(RECORD_STATUS).optional(),
});
export const productUpdateSchema = productCreateSchema.partial();

export const goalCreateSchema = z.object({
  departmentId: optionalId,
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  metric: z.string().optional(),
  baselineValue: z.coerce.number().min(0).optional(),
  targetValue: z.coerce.number(),
  currentValue: z.coerce.number().min(0).optional(),
  unit: z.string().optional(),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(GOAL_STATUS).optional(),
});
export const goalUpdateSchema = goalCreateSchema.partial();

export const operationCreateSchema = z.object({
  departmentId: optionalId,
  operationType: z.enum(OPERATION_TYPES),
  referenceNumber: z.string().optional(),
  description: z.string().optional(),
  operationDate: z.coerce.date(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  amount: z.coerce.number().optional(),
  emissionFactorId: optionalId,
});
