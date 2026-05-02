export const UserRole = {
  FAMILY: "FAMILY",
  PROFESSIONAL: "PROFESSIONAL",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const ServiceType = {
  BABYSITTER: "BABYSITTER",
  ELDER_CAREGIVER: "ELDER_CAREGIVER",
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export const Weekday = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const;
export type Weekday = (typeof Weekday)[keyof typeof Weekday];

export const Shift = {
  MORNING: "MORNING",
  AFTERNOON: "AFTERNOON",
  EVENING: "EVENING",
  OVERNIGHT: "OVERNIGHT",
} as const;
export type Shift = (typeof Shift)[keyof typeof Shift];

export const VerificationStatus = {
  NOT_SUBMITTED: "NOT_SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const JobStatus = {
  OPEN: "OPEN",
  PAUSED: "PAUSED",
  CLOSED: "CLOSED",
  ARCHIVED: "ARCHIVED",
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const ApplicationStatus = {
  SUBMITTED: "SUBMITTED",
  SHORTLISTED: "SHORTLISTED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const ContractStatus = {
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
} as const;
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

export const JobInvitationStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  EXPIRED: "EXPIRED",
  CANCELED: "CANCELED",
} as const;
export type JobInvitationStatus = (typeof JobInvitationStatus)[keyof typeof JobInvitationStatus];

export const MessageKind = {
  TEXT: "TEXT",
  QUICK_REPLY: "QUICK_REPLY",
  TEXT_WITH_ATTACHMENTS: "TEXT_WITH_ATTACHMENTS",
} as const;
export type MessageKind = (typeof MessageKind)[keyof typeof MessageKind];

export const ReportStatus = {
  OPEN: "OPEN",
  IN_REVIEW: "IN_REVIEW",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ReportTargetType = {
  USER: "USER",
  JOB: "JOB",
  MESSAGE: "MESSAGE",
  PROFESSIONAL_PROFILE: "PROFESSIONAL_PROFILE",
  CONVERSATION: "CONVERSATION",
} as const;
export type ReportTargetType = (typeof ReportTargetType)[keyof typeof ReportTargetType];

export const NotificationType = {
  APPLICATION_RECEIVED: "APPLICATION_RECEIVED",
  APPLICATION_STATUS_UPDATED: "APPLICATION_STATUS_UPDATED",
  INVITATION_RECEIVED: "INVITATION_RECEIVED",
  INVITATION_STATUS_UPDATED: "INVITATION_STATUS_UPDATED",
  CHAT_MESSAGE: "CHAT_MESSAGE",
  CONTRACT_STATUS_UPDATED: "CONTRACT_STATUS_UPDATED",
  DOCUMENT_STATUS_UPDATED: "DOCUMENT_STATUS_UPDATED",
  REPORT_STATUS_UPDATED: "REPORT_STATUS_UPDATED",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const DocumentType = {
  IDENTITY: "IDENTITY",
  BACKGROUND_CHECK: "BACKGROUND_CHECK",
  CERTIFICATION: "CERTIFICATION",
  OTHER: "OTHER",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];
