import type {
  JobStatus,
  PagedResult,
  ServiceType,
  Weekday,
} from "@/src/lib/types/marketplace";

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

export type ContractStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELED";

export type FamilyProfile = {
  id: string;
  userId: string;
  contactName?: string | null;
  bio?: string | null;
  state?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FamilyProfileResponse = {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    role: "FAMILY";
    status: "ACTIVE" | "PENDING" | "SUSPENDED" | "BANNED";
  };
  profile: FamilyProfile | null;
};

export type FamilyProfileInput = {
  contactName: string;
  phone?: string;
  bio?: string;
  state: string;
  city: string;
  neighborhood?: string;
};

export type JobScheduleSlotInput = {
  weekday: Weekday;
  startTime: string;
  endTime: string;
};

export type FamilyJob = {
  id: string;
  familyId: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  state: string;
  city: string;
  neighborhood?: string | null;
  hourlyRateMin?: number | null;
  hourlyRateMax?: number | null;
  scheduleDetails?: string | null;
  status: JobStatus;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  scheduleSlots: JobScheduleSlotInput[];
  scheduleSummary?: {
    weekday: Weekday;
    label: string;
    ranges: string[];
  }[];
  _count?: {
    applications: number;
  };
};

export type FamilyJobPayload = {
  serviceType: ServiceType;
  title: string;
  description: string;
  state: string;
  city: string;
  neighborhood?: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  scheduleDetails?: string;
  scheduleSlots: JobScheduleSlotInput[];
  status?: JobStatus;
};

export type FamilyApplication = {
  id: string;
  jobId: string;
  professionalId: string;
  coverMessage?: string | null;
  status: ApplicationStatus;
  isFavoriteByFamily: boolean;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  fromInvitation: boolean;
  job: {
    id: string;
    title: string;
    city: string;
    state: string;
    serviceType: ServiceType;
    status: JobStatus;
  };
  professional: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    professionalProfile: {
      id: string;
      city: string | null;
      state: string | null;
      verificationStatus: "NOT_SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
      serviceTypes: ServiceType[];
      experienceYears: number | null;
    } | null;
  };
};

export type FamilyInvitation = {
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
    status: JobStatus;
  };
  professional: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export type FamilyContract = {
  id: string;
  jobId: string;
  applicationId: string;
  familyId: string;
  professionalId: string;
  status: ContractStatus;
  startedAt: string;
  completedAt?: string | null;
  canceledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    status: JobStatus;
    city: string;
    state: string;
  };
  family: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  professional: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  canceledBy?: {
    id: string;
    name: string | null;
  } | null;
};

export type FamilyApplicationsResponse = PagedResult<FamilyApplication>;
export type FamilyInvitationsResponse = PagedResult<FamilyInvitation>;
