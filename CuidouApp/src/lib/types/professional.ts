import type * as DocumentPicker from "expo-document-picker";

import type { PagedResult, ServiceType, Shift, Weekday } from "@/src/lib/types/marketplace";

export type ApplicationStatus =
  | "SUBMITTED"
  | "SHORTLISTED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type JobInvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELED";

export type VerificationStatus = "NOT_SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";

export type DocumentType = "IDENTITY" | "BACKGROUND_CHECK" | "CERTIFICATION" | "OTHER";

export type ProfessionalProfile = {
  id: string;
  userId: string;
  bio?: string | null;
  experienceYears?: number | null;
  serviceTypes: ServiceType[];
  availability?: string | null;
  state?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  hourlyRateMin?: number | null;
  hourlyRateMax?: number | null;
  verificationStatus: VerificationStatus;
  verificationNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: ProfessionalDocument[];
};

export type AvailabilitySlot = {
  weekday: Weekday;
  shift: Shift;
  isAvailable: boolean;
};

export type AvailabilityException = {
  date: string;
  shift: Shift;
  isAvailable: boolean;
  note?: string | null;
};

export type AvailabilityPayload = {
  weeklySlots: AvailabilitySlot[];
  exceptions: AvailabilityException[];
  legacyAvailabilityText?: string | null;
};

export type ProfessionalDocument = {
  id: string;
  professionalProfileId: string;
  documentType: DocumentType;
  fileUrl: string;
  status: VerificationStatus;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfessionalInvitation = {
  id: string;
  jobId: string;
  familyId: string;
  professionalId: string;
  status: JobInvitationStatus;
  message?: string | null;
  responseMessage?: string | null;
  expiresAt: string;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    city: string;
    state: string;
    serviceType: ServiceType;
    status: "OPEN" | "PAUSED" | "CLOSED" | "ARCHIVED";
  };
  family: {
    id: string;
    name: string | null;
  };
};

export type ProfessionalApplication = {
  id: string;
  status: ApplicationStatus;
  coverMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    city: string;
    state: string;
  };
};

export type ProfessionalProfileResponse = {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    role: "PROFESSIONAL";
    status: "ACTIVE" | "PENDING" | "SUSPENDED" | "BANNED";
  };
  profile: ProfessionalProfile | null;
};

export type ProfessionalDocumentsResponse = PagedResult<ProfessionalDocument>;
export type ProfessionalApplicationsResponse = PagedResult<ProfessionalApplication>;

export type UploadDocumentInput = {
  documentType: DocumentType;
  file: DocumentPicker.DocumentPickerAsset;
};
