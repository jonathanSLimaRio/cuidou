export type AdminMetrics = {
  windowDays: number;
  averageTimeToHireHours: number | null;
  responseRate24h: number;
  contractsByStatus: Record<string, number>;
  reportsByTargetType: Record<string, number>;
  applicationsTrendDaily: Array<{ date: string; count: number }>;
};

export type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "FAMILY" | "PROFESSIONAL" | "ADMIN";
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "BANNED";
  createdAt: string;
};

export type AdminDocument = {
  id: string;
  documentType: string;
  status: "NOT_SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  professionalProfile: {
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  };
};

export type AdminReport = {
  id: string;
  targetType: string;
  reason: string;
  details: string | null;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  reporter: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export type AdminJob = {
  id: string;
  title: string;
  status: "OPEN" | "PAUSED" | "CLOSED" | "ARCHIVED";
  isVisible: boolean;
  createdAt: string;
  family: {
    id: string;
    name: string | null;
    email: string | null;
  };
  _count: {
    applications: number;
    reports: number;
  };
};

export type AdminInvite = {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  admin: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export type AuditLogPage = {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
