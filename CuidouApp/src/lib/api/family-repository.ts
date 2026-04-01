import { apiRequest } from "@/src/lib/api/client";
import type {
  ApplicationStatus,
  FamilyApplicationsResponse,
  FamilyContract,
  FamilyInvitation,
  FamilyInvitationsResponse,
  FamilyJob,
  FamilyJobPayload,
  FamilyProfileInput,
  FamilyProfileResponse,
  JobInvitationStatus,
} from "@/src/lib/types/family";
import type { JobStatus } from "@/src/lib/types/marketplace";

export const familyRepository = {
  async getFamilyProfile(): Promise<FamilyProfileResponse> {
    return apiRequest<FamilyProfileResponse>("/api/family/profile", {
      method: "GET",
      auth: true,
    });
  },

  async updateFamilyProfile(input: FamilyProfileInput) {
    return apiRequest<{ profile: unknown }>("/api/family/profile", {
      method: "PUT",
      auth: true,
      json: {
        contactName: input.contactName,
        phone: input.phone?.trim() || undefined,
        bio: input.bio?.trim() || undefined,
        state: input.state,
        city: input.city,
        neighborhood: input.neighborhood?.trim() || undefined,
      },
    });
  },

  async listMyJobs(params?: {
    page?: number;
    pageSize?: number;
    status?: JobStatus;
  }) {
    return apiRequest<{
      items: FamilyJob[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>("/api/jobs", {
      method: "GET",
      auth: true,
      query: {
        mine: "true",
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        status: params?.status,
      },
    });
  },

  async createJob(input: FamilyJobPayload) {
    return apiRequest<{ job: FamilyJob }>("/api/jobs", {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  async updateJob(jobId: string, input: FamilyJobPayload) {
    return apiRequest<{ job: FamilyJob }>(`/api/jobs/${jobId}`, {
      method: "PUT",
      auth: true,
      json: input,
    });
  },

  async listFamilyApplications(params?: {
    page?: number;
    pageSize?: number;
    status?: ApplicationStatus;
    jobId?: string;
  }): Promise<FamilyApplicationsResponse> {
    return apiRequest<FamilyApplicationsResponse>("/api/family/applications", {
      method: "GET",
      auth: true,
      query: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        status: params?.status,
        jobId: params?.jobId,
      },
    });
  },

  async acceptApplication(applicationId: string) {
    return apiRequest<{
      application: { status: ApplicationStatus };
      contract: { id: string };
    }>(`/api/applications/${applicationId}/accept`, {
      method: "POST",
      auth: true,
    });
  },

  async rejectApplication(applicationId: string, favorite?: boolean) {
    return apiRequest<{ application: { status: ApplicationStatus; isFavoriteByFamily: boolean } }>(
      `/api/applications/${applicationId}/reject`,
      {
        method: "POST",
        auth: true,
        json: {
          favorite,
        },
      },
    );
  },

  async favoriteApplication(applicationId: string, favorite: boolean) {
    return apiRequest<{ application: { isFavoriteByFamily: boolean } }>(
      `/api/applications/${applicationId}/favorite`,
      {
        method: "POST",
        auth: true,
        json: {
          favorite,
        },
      },
    );
  },

  async listFamilyInvitations(params?: {
    page?: number;
    pageSize?: number;
    status?: JobInvitationStatus;
    jobId?: string;
  }): Promise<FamilyInvitationsResponse> {
    return apiRequest<FamilyInvitationsResponse>("/api/family/invitations", {
      method: "GET",
      auth: true,
      query: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        status: params?.status,
        jobId: params?.jobId,
      },
    });
  },

  async cancelInvitation(invitationId: string) {
    return apiRequest<{ invitation: FamilyInvitation }>(`/api/invitations/${invitationId}/cancel`, {
      method: "POST",
      auth: true,
    });
  },

  async listFamilyContracts() {
    return apiRequest<{ items: FamilyContract[] }>("/api/contracts", {
      method: "GET",
      auth: true,
    });
  },

  async completeContract(contractId: string, note?: string) {
    return apiRequest<{ contract: FamilyContract }>(`/api/contracts/${contractId}/complete`, {
      method: "POST",
      auth: true,
      json: {
        note: note?.trim() || undefined,
      },
    });
  },

  async cancelContract(contractId: string, reason: string) {
    return apiRequest<{ contract: FamilyContract }>(`/api/contracts/${contractId}/cancel`, {
      method: "POST",
      auth: true,
      json: {
        reason: reason.trim(),
      },
    });
  },

  async submitReview(applicationId: string, rating: number, comment?: string) {
    return apiRequest<{ review: { id: string } }>("/api/reviews", {
      method: "POST",
      auth: true,
      json: { applicationId, rating, comment: comment?.trim() || undefined },
    });
  },

  async getNotifications(params?: { page?: number; unreadOnly?: boolean }) {
    return apiRequest<{
      items: Array<{
        id: string;
        type: string;
        title: string;
        body: string | null;
        createdAt: string;
        readAt: string | null;
        data: Record<string, string> | null;
      }>;
      total: number;
      totalPages: number;
      page: number;
    }>("/api/notifications", {
      method: "GET",
      auth: true,
      query: {
        page: params?.page ?? 1,
        pageSize: 20,
        unreadOnly: params?.unreadOnly ? "true" : "false",
      },
    });
  },

  async markAllNotificationsRead() {
    return apiRequest<{ success: boolean }>("/api/notifications", {
      method: "PATCH",
      auth: true,
    });
  },

  async markNotificationRead(notificationId: string) {
    return apiRequest<{ success: boolean }>(`/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      auth: true,
    });
  },
};

