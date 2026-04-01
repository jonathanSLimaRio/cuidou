export type ServiceType = "BABYSITTER" | "ELDER_CAREGIVER";
export type JobStatus = "OPEN" | "PAUSED" | "CLOSED" | "ARCHIVED";
export type VerificationStatus = "NOT_SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
export type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";
export type Shift = "MORNING" | "AFTERNOON" | "EVENING" | "OVERNIGHT";

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type JobScheduleSlot = {
  id?: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
};

export type JobListItem = {
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
  status: JobStatus;
  isVisible: boolean;
  createdAt: string;
  family?: {
    id: string;
    name: string | null;
  };
  _count?: {
    applications: number;
  };
  scheduleSlots?: JobScheduleSlot[];
  scheduleSummary?: string | null;
};

export type JobDetail = JobListItem & {
  scheduleDetails?: string | null;
};

export type ProfessionalAvailabilitySlot = {
  id?: string;
  weekday: Weekday;
  shift: Shift;
  isAvailable: boolean;
};

export type ProfessionalAvailabilityException = {
  id: string;
  date: string;
  shift: Shift;
  isAvailable: boolean;
  note?: string | null;
};

export type ProfessionalListItem = {
  id: string;
  userId: string;
  bio?: string | null;
  experienceYears?: number | null;
  serviceTypes: ServiceType[];
  state?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  hourlyRateMin?: number | null;
  hourlyRateMax?: number | null;
  verificationStatus: VerificationStatus;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    image?: string | null;
  };
  availabilitySlots?: ProfessionalAvailabilitySlot[];
  reputation?: {
    averageRating: number | null;
    totalReviews: number;
  };
};

export type ProfessionalDetail = ProfessionalListItem & {
  availabilityExceptions: ProfessionalAvailabilityException[];
  reputation: {
    averageRating: number | null;
    totalReviews: number;
  };
};

export type JobsFilter = {
  serviceType?: ServiceType | "";
  state?: string;
  city?: string;
};

export type ProfessionalsFilter = {
  serviceType?: ServiceType | "";
  state?: string;
  city?: string;
  verifiedOnly?: boolean;
};
