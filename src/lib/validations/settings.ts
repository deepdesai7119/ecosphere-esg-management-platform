import { z } from "zod";

const RECORD_STATUS = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;
const CATEGORY_TYPES = ["CSR_ACTIVITY", "CHALLENGE", "ESG", "TRAINING"] as const;
const ROLES = ["ORG_ADMIN", "ESG_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE", "AUDITOR"] as const;

/** Empty-string select values become null so optional FKs are cleared correctly. */
const optionalId = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v));

// ----------------------------- Departments -----------------------------

export const departmentCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  headUserId: optionalId,
  parentDepartmentId: optionalId,
  employeeCount: z.coerce.number().int().min(0).optional(),
  status: z.enum(RECORD_STATUS).optional(),
});
export const departmentUpdateSchema = departmentCreateSchema.partial();

// ----------------------------- Categories -----------------------------

export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(CATEGORY_TYPES),
  description: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(RECORD_STATUS).optional(),
});
export const categoryUpdateSchema = categoryCreateSchema.partial();

// ----------------------------- Users -----------------------------

export const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("A valid email is required"),
  role: z.enum(ROLES),
  departmentId: optionalId,
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(ROLES).optional(),
  departmentId: optionalId,
  status: z.enum(RECORD_STATUS).optional(),
});

// ----------------------------- ESG configuration -----------------------------

export const esgConfigSchema = z
  .object({
    environmentalWeight: z.coerce.number().int().min(0).max(100),
    socialWeight: z.coerce.number().int().min(0).max(100),
    governanceWeight: z.coerce.number().int().min(0).max(100),
    autoEmissionCalculationEnabled: z.boolean(),
    evidenceRequiredForCsrApproval: z.boolean(),
    badgeAutoAwardEnabled: z.boolean(),
    complianceReminderEnabled: z.boolean(),
    policyReminderEnabled: z.boolean(),
    emailNotificationsEnabled: z.boolean(),
    inAppNotificationsEnabled: z.boolean(),
  })
  .partial();

// ----------------------------- Notification preferences -----------------------------

export const notificationPrefSchema = z
  .object({
    complianceIssueNotifications: z.boolean(),
    participationDecisionNotifications: z.boolean(),
    policyReminderNotifications: z.boolean(),
    badgeUnlockNotifications: z.boolean(),
    emailEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
  })
  .partial();

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type EsgConfigInput = z.infer<typeof esgConfigSchema>;
export type NotificationPrefInput = z.infer<typeof notificationPrefSchema>;
