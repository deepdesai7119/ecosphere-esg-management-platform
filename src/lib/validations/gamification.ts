import { z } from "zod";

const CHALLENGE_STATUS = ["DRAFT", "ACTIVE", "UNDER_REVIEW", "COMPLETED", "ARCHIVED"] as const;
const DIFFICULTY = ["EASY", "MEDIUM", "HARD"] as const;
const RECORD_STATUS = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;
const UNLOCK_METRIC = [
  "TOTAL_XP",
  "COMPLETED_CHALLENGES",
  "CSR_PARTICIPATIONS",
  "POLICY_ACKNOWLEDGEMENTS",
] as const;
const REDEMPTION_STATUS = ["PENDING", "APPROVED", "FULFILLED", "REJECTED"] as const;

/** Optional id/select value: coerce "" → null so unselected relations clear cleanly. */
const optionalId = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v));

// ------------------------------ Challenges ------------------------------

export const challengeCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  categoryId: optionalId,
  departmentId: optionalId,
  xp: z.coerce.number().int().default(0),
  difficulty: z.enum(DIFFICULTY).default("MEDIUM"),
  evidenceRequired: z.boolean().default(true),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  status: z.enum(CHALLENGE_STATUS).optional(),
  goalId: optionalId,
  goalContribution: z.coerce.number().min(0, "Contribution cannot be negative").optional(),
});
export const challengeUpdateSchema = challengeCreateSchema.partial();

export const challengeStatusSchema = z.object({
  status: z.enum(CHALLENGE_STATUS),
});

// ---------------------------- Participation -----------------------------

export const progressSchema = z.object({
  progressPercentage: z.coerce.number().min(0).max(100).optional(),
  proofFileUrl: z.string().optional(),
  proofComment: z.string().optional(),
});

export const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewComment: z.string().optional(),
});

// ------------------------------- Badges ---------------------------------

export const badgeCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().default("Award"),
  unlockMetric: z.enum(UNLOCK_METRIC).default("TOTAL_XP"),
  unlockThreshold: z.coerce.number().int().default(0),
  status: z.enum(RECORD_STATUS).optional(),
});
export const badgeUpdateSchema = badgeCreateSchema.partial();

// ------------------------------- Rewards --------------------------------

export const rewardCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  pointsRequired: z.coerce.number().int(),
  stock: z.coerce.number().int().default(0),
  imageUrl: z.string().optional(),
  status: z.enum(RECORD_STATUS).optional(),
});
export const rewardUpdateSchema = rewardCreateSchema.partial();

export const redeemSchema = z.object({
  quantity: z.coerce.number().int().default(1),
});

export const processSchema = z.object({
  status: z.enum(REDEMPTION_STATUS),
});
