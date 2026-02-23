import { z } from "zod";

const roleSchema = z.enum(["FAMILY", "PROFESSIONAL"]);
const serviceTypeSchema = z.enum(["BABYSITTER", "ELDER_CAREGIVER"]);
const strongPasswordSchema = z
  .string()
  .min(8, "Password must have at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");
export const weekdaySchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);
export const shiftSchema = z.enum(["MORNING", "AFTERNOON", "EVENING", "OVERNIGHT"]);

export const onboardingRoleSchema = z.object({
  role: roleSchema,
  acceptTerms: z.literal(true),
  acceptPrivacy: z.literal(true),
});

export const localSignupSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.email().trim().toLowerCase(),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const familyProfileSchema = z.object({
  contactName: z.string().min(2).max(120),
  phone: z.string().min(8).max(30).optional(),
  bio: z.string().max(1200).optional(),
  state: z.string().min(2).max(120),
  city: z.string().min(2).max(120),
  neighborhood: z.string().max(120).optional(),
});

export const professionalProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  experienceYears: z.number().int().min(0).max(70).optional(),
  serviceTypes: z.array(serviceTypeSchema).min(1),
  // Legacy text field kept for backward compatibility during calendar rollout.
  availability: z.string().max(1000).optional(),
  state: z.string().min(2).max(120),
  city: z.string().min(2).max(120),
  neighborhood: z.string().max(120).optional(),
  hourlyRateMin: z.number().int().positive().optional(),
  hourlyRateMax: z.number().int().positive().optional(),
  phone: z.string().min(8).max(30).optional(),
});

export const availabilitySlotSchema = z.object({
  weekday: weekdaySchema,
  shift: shiftSchema,
  isAvailable: z.boolean(),
});

export const availabilityExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shift: shiftSchema,
  isAvailable: z.boolean(),
  note: z.string().max(240).optional(),
});

export const professionalAvailabilitySchema = z
  .object({
    weeklySlots: z.array(availabilitySlotSchema).max(28),
    exceptions: z.array(availabilityExceptionSchema).max(120),
  })
  .superRefine((value, ctx) => {
    const weeklyKeys = new Set<string>();
    for (const slot of value.weeklySlots) {
      const key = `${slot.weekday}:${slot.shift}`;
      if (weeklyKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicated weekday/shift pair in weeklySlots",
          path: ["weeklySlots"],
        });
      }
      weeklyKeys.add(key);
    }

    const exceptionKeys = new Set<string>();
    for (const exception of value.exceptions) {
      const key = `${exception.date}:${exception.shift}`;
      if (exceptionKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicated date/shift pair in exceptions",
          path: ["exceptions"],
        });
      }
      exceptionKeys.add(key);
    }
  });

export const createJobSchema = z.object({
  serviceType: serviceTypeSchema,
  title: z.string().min(5).max(160),
  description: z.string().min(20).max(4000),
  state: z.string().min(2).max(120),
  city: z.string().min(2).max(120),
  neighborhood: z.string().max(120).optional(),
  hourlyRateMin: z.number().int().positive().optional(),
  hourlyRateMax: z.number().int().positive().optional(),
  scheduleDetails: z.string().max(1000).optional(),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(["OPEN", "PAUSED", "CLOSED", "ARCHIVED"]).optional(),
  isVisible: z.boolean().optional(),
});

export const applicationSchema = z.object({
  coverMessage: z.string().min(10).max(1500),
});

export const applicationDecisionSchema = z.object({
  favorite: z.boolean().optional(),
});

export const messageSchema = z
  .object({
    content: z.string().max(4000).optional(),
    quickReplyKey: z.string().min(2).max(120).optional(),
  })
  .refine((value) => Boolean(value.content?.trim() || value.quickReplyKey), {
    message: "content or quickReplyKey is required",
    path: ["content"],
  });

export const reviewSchema = z.object({
  applicationId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const completeContractSchema = z.object({
  note: z.string().max(240).optional(),
});

export const cancelContractSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const reportSchema = z
  .object({
    targetType: z.enum(["USER", "JOB", "MESSAGE", "PROFESSIONAL_PROFILE", "CONVERSATION"]),
    reason: z.string().min(5).max(240),
    details: z.string().max(1500).optional(),
    targetUserId: z.string().cuid().optional(),
    targetJobId: z.string().cuid().optional(),
    targetMessageId: z.string().cuid().optional(),
    targetProfessionalProfileId: z.string().cuid().optional(),
    targetConversationId: z.string().cuid().optional(),
  })
  .refine(
    (value) => {
      const map = {
        USER: value.targetUserId,
        JOB: value.targetJobId,
        MESSAGE: value.targetMessageId,
        PROFESSIONAL_PROFILE: value.targetProfessionalProfileId,
        CONVERSATION: value.targetConversationId,
      };

      return Boolean(map[value.targetType]);
    },
    {
      message: "Target id is required for selected targetType",
      path: ["targetType"],
    },
  );

export const adminUserStatusSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "BANNED"]),
});

export const adminJobStatusSchema = z.object({
  status: z.enum(["OPEN", "PAUSED", "CLOSED", "ARCHIVED"]),
  isVisible: z.boolean().optional(),
});

export const adminDocumentReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().max(500).optional(),
});

export const adminReportResolveSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
  resolutionNotes: z.string().max(1200).optional(),
});

export const adminMetricsQuerySchema = z.object({
  window: z.enum(["7", "30", "90"]).default("30"),
});

export const adminInviteSchema = z.object({
  email: z.email(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});
