import { z } from "zod";

const RECORD_STATUS = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

const optionalId = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v));

export const activityCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  categoryId: optionalId,
  departmentId: optionalId,
  activityDate: z.coerce.date().optional(),
  registrationDeadline: z.coerce.date().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  points: z.coerce.number().int().min(0).default(0),
  evidenceRequired: z.boolean().optional(),
  status: z.enum(RECORD_STATUS).optional(),
});
export const activityUpdateSchema = activityCreateSchema.partial();

export const trainingCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  departmentId: optionalId,
  dueDate: z.coerce.date().optional(),
  status: z.enum(RECORD_STATUS).optional(),
});
export const trainingUpdateSchema = trainingCreateSchema.partial();

export const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewComment: z.string().optional(),
});

export const proofSchema = z.object({
  proofFileUrl: z.string().optional(),
  proofComment: z.string().optional(),
});
