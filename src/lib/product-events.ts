import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const ProductEventName = {
  LEAD_CAPTURED: "lead_captured",
  SIGNUP_COMPLETED: "signup_completed",
  JOB_PUBLISHED: "job_published",
  APPLICATION_SUBMITTED: "application_submitted",
  APPLICATION_ACCEPTED: "application_accepted",
  CONTRACT_COMPLETED: "contract_completed",
  PROFILE_COMPLETED: "profile_completed",
  REPORT_SUBMITTED: "report_submitted",
  REVIEW_SUBMITTED: "review_submitted",
  LOGIN_COMPLETED: "login_completed",
} as const;

export type ProductEventName = (typeof ProductEventName)[keyof typeof ProductEventName];

export function trackProductEvent(params: {
  name: ProductEventName;
  userId?: string;
  anonymousId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  void prisma.productEvent
    .create({
      data: {
        name: params.name,
        userId: params.userId,
        anonymousId: params.anonymousId,
        metadata: params.metadata,
      },
    })
    .catch((error) => {
      logger.error("Failed to persist product event", error, { eventName: params.name });
    });
}
