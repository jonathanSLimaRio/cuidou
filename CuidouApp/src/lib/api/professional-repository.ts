import { apiRequest } from "@/src/lib/api/client";
import type {
  ApplicationStatus,
  AvailabilityPayload,
  JobInvitationStatus,
  ProfessionalApplicationsResponse,
  ProfessionalDocumentsResponse,
  ProfessionalInvitation,
  ProfessionalProfileResponse,
  UploadDocumentInput,
  VerificationStatus,
} from "@/src/lib/types/professional";

type UpdateProfilePayload = {
  bio?: string;
  experienceYears?: number;
  serviceTypes: ("BABYSITTER" | "ELDER_CAREGIVER")[];
  availability?: string;
  state: string;
  city: string;
  neighborhood?: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  phone?: string;
};

export const professionalRepository = {
  async getProfile(): Promise<ProfessionalProfileResponse> {
    return apiRequest<ProfessionalProfileResponse>("/api/professional/profile", {
      method: "GET",
      auth: true,
    });
  },

  async updateProfile(input: UpdateProfilePayload) {
    return apiRequest<{ profile: unknown }>("/api/professional/profile", {
      method: "PUT",
      auth: true,
      json: input,
    });
  },

  async getAvailability(): Promise<AvailabilityPayload> {
    return apiRequest<AvailabilityPayload>("/api/professional/availability", {
      method: "GET",
      auth: true,
    });
  },

  async updateAvailability(input: AvailabilityPayload) {
    return apiRequest<AvailabilityPayload>("/api/professional/availability", {
      method: "PUT",
      auth: true,
      json: input,
    });
  },

  async listDocuments(params?: {
    page?: number;
    pageSize?: number;
    status?: VerificationStatus;
  }): Promise<ProfessionalDocumentsResponse> {
    return apiRequest<ProfessionalDocumentsResponse>("/api/professional/documents", {
      method: "GET",
      auth: true,
      query: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        status: params?.status,
      },
    });
  },

  async uploadDocument(input: UploadDocumentInput) {
    const formData = new FormData();
    formData.append("documentType", input.documentType);
    formData.append(
      "file",
      {
        uri: input.file.uri,
        name: input.file.name ?? "document",
        type: input.file.mimeType ?? "application/octet-stream",
      } as unknown as Blob,
    );

    return apiRequest<{ document: unknown }>("/api/professional/documents", {
      method: "POST",
      auth: true,
      body: formData,
    });
  },

  async listInvitations(status?: JobInvitationStatus): Promise<{ items: ProfessionalInvitation[] }> {
    return apiRequest<{ items: ProfessionalInvitation[] }>("/api/professional/invitations", {
      method: "GET",
      auth: true,
      query: { status },
    });
  },

  async acceptInvitation(invitationId: string, coverMessage: string) {
    return apiRequest<{ invitation: { status: JobInvitationStatus } }>(
      `/api/invitations/${invitationId}/accept`,
      {
        method: "POST",
        auth: true,
        json: { coverMessage },
      },
    );
  },

  async declineInvitation(invitationId: string, reason?: string) {
    return apiRequest<{ invitation: { status: JobInvitationStatus } }>(
      `/api/invitations/${invitationId}/decline`,
      {
        method: "POST",
        auth: true,
        json: { reason: reason?.trim() || undefined },
      },
    );
  },

  async listApplications(params?: {
    page?: number;
    pageSize?: number;
    status?: ApplicationStatus;
  }): Promise<ProfessionalApplicationsResponse> {
    return apiRequest<ProfessionalApplicationsResponse>("/api/professional/applications", {
      method: "GET",
      auth: true,
      query: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        status: params?.status,
      },
    });
  },

  async withdrawApplication(applicationId: string) {
    return apiRequest<{ application: { id: string; status: ApplicationStatus } }>(
      `/api/applications/${applicationId}/withdraw`,
      { method: "POST", auth: true },
    );
  },

  async listContracts() {
    return apiRequest<{
      items: import("@/src/lib/types/family").FamilyContract[];
    }>("/api/contracts", {
      method: "GET",
      auth: true,
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
      items: {
        id: string;
        type: string;
        title: string;
        body: string | null;
        createdAt: string;
        readAt: string | null;
        data: Record<string, string> | null;
      }[];
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
