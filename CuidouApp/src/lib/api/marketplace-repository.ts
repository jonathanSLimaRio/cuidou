import { apiRequest } from "@/src/lib/api/client";
import type {
  JobDetail,
  JobListItem,
  JobsFilter,
  PagedResult,
  ProfessionalDetail,
  ProfessionalListItem,
  ProfessionalsFilter,
} from "@/src/lib/types/marketplace";

type ReportTargetType = "USER" | "JOB" | "MESSAGE" | "PROFESSIONAL_PROFILE" | "CONVERSATION";

type ReportPayload = {
  targetType: ReportTargetType;
  reason: string;
  details?: string;
  targetUserId?: string;
  targetJobId?: string;
  targetMessageId?: string;
  targetProfessionalProfileId?: string;
  targetConversationId?: string;
};

export const marketplaceRepository = {
  async listJobs(
    filters: JobsFilter,
    page: number,
    pageSize = 20,
  ): Promise<PagedResult<JobListItem>> {
    return apiRequest<PagedResult<JobListItem>>("/api/jobs", {
      method: "GET",
      query: {
        serviceType: filters.serviceType || undefined,
        state: filters.state?.trim() || undefined,
        city: filters.city?.trim() || undefined,
        page,
        pageSize,
      },
    });
  },

  async getJob(jobId: string): Promise<JobDetail> {
    const result = await apiRequest<{ job: JobDetail }>(`/api/jobs/${jobId}`, {
      method: "GET",
    });
    return result.job;
  },

  async applyToJob(jobId: string, coverMessage: string) {
    return apiRequest<{ application: { id: string }; scheduleMatchWarning?: { message?: string } }>(
      `/api/jobs/${jobId}/applications`,
      {
        method: "POST",
        auth: true,
        json: { coverMessage },
      },
    );
  },

  async listProfessionals(
    filters: ProfessionalsFilter,
    page: number,
    pageSize = 20,
  ): Promise<PagedResult<ProfessionalListItem>> {
    return apiRequest<PagedResult<ProfessionalListItem>>("/api/professionals", {
      method: "GET",
      query: {
        serviceType: filters.serviceType || undefined,
        state: filters.state?.trim() || undefined,
        city: filters.city?.trim() || undefined,
        verifiedOnly: filters.verifiedOnly === false ? "false" : "true",
        page,
        pageSize,
      },
    });
  },

  async getProfessional(profileId: string): Promise<ProfessionalDetail> {
    const result = await apiRequest<{ professional: ProfessionalDetail }>(
      `/api/professionals/${profileId}`,
      {
        method: "GET",
      },
    );

    return result.professional;
  },

  async listMyOpenJobs(page = 1, pageSize = 50): Promise<PagedResult<JobListItem>> {
    return apiRequest<PagedResult<JobListItem>>("/api/jobs", {
      method: "GET",
      auth: true,
      query: {
        mine: "true",
        status: "OPEN",
        page,
        pageSize,
      },
    });
  },

  async inviteProfessional(input: {
    jobId: string;
    professionalId: string;
    message?: string;
  }) {
    return apiRequest<{ invitation: { id: string } }>(`/api/jobs/${input.jobId}/invitations`, {
      method: "POST",
      auth: true,
      json: {
        professionalId: input.professionalId,
        message: input.message?.trim() || undefined,
        expiresInDays: 7,
      },
    });
  },

  async createReport(input: ReportPayload) {
    return apiRequest<{ report: { id: string } }>("/api/reports", {
      method: "POST",
      auth: true,
      json: input,
    });
  },
};
