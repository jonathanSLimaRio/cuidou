import { apiRequest } from "@/src/lib/api/client";
import type {
  AdminDocument,
  AdminInvite,
  AdminJob,
  AdminMetrics,
  AdminReport,
  AdminUser,
} from "@/src/lib/types/admin";

export const adminRepository = {
  async getMetrics(window: 7 | 30 | 90 = 30): Promise<AdminMetrics> {
    return apiRequest<AdminMetrics>(`/api/admin/metrics?window=${window}`, {
      method: "GET",
      auth: true,
    });
  },

  async listPendingUsers(): Promise<{ items: AdminUser[] }> {
    return apiRequest<{ items: AdminUser[] }>(
      "/api/admin/moderation/users?status=PENDING&pageSize=100",
      { method: "GET", auth: true },
    );
  },

  async updateUserStatus(userId: string, status: AdminUser["status"], reason?: string) {
    return apiRequest<{ user: AdminUser }>(`/api/admin/users/${userId}/status`, {
      method: "POST",
      auth: true,
      json: { status, reason },
    });
  },

  async listPendingDocuments(): Promise<{ items: AdminDocument[] }> {
    return apiRequest<{ items: AdminDocument[] }>(
      "/api/admin/moderation/documents?status=UNDER_REVIEW&pageSize=100",
      { method: "GET", auth: true },
    );
  },

  async reviewDocument(
    documentId: string,
    action: "APPROVE" | "REJECT",
    reason?: string,
  ) {
    return apiRequest<{ document: AdminDocument }>(`/api/admin/documents/${documentId}/review`, {
      method: "POST",
      auth: true,
      json: { action, reason },
    });
  },

  async listOpenReports(): Promise<{ items: AdminReport[] }> {
    return apiRequest<{ items: AdminReport[] }>(
      "/api/admin/moderation/reports?pageSize=100",
      { method: "GET", auth: true },
    );
  },

  async resolveReport(
    reportId: string,
    status: "RESOLVED" | "DISMISSED",
    resolutionNotes?: string,
  ) {
    return apiRequest<{ report: AdminReport }>(`/api/admin/reports/${reportId}/resolve`, {
      method: "POST",
      auth: true,
      json: { status, resolutionNotes },
    });
  },

  async listJobs(params?: { status?: string }): Promise<{ items: AdminJob[] }> {
    const query = params?.status ? `?status=${params.status}&pageSize=100` : "?pageSize=100";
    return apiRequest<{ items: AdminJob[] }>(`/api/admin/moderation/jobs${query}`, {
      method: "GET",
      auth: true,
    });
  },

  async updateJobStatus(
    jobId: string,
    status: AdminJob["status"],
    isVisible: boolean,
  ) {
    return apiRequest<{ job: AdminJob }>(`/api/admin/jobs/${jobId}/status`, {
      method: "POST",
      auth: true,
      json: { status, isVisible },
    });
  },

  async listInvites(): Promise<{ items: AdminInvite[] }> {
    return apiRequest<{ items: AdminInvite[] }>("/api/admin/invites", {
      method: "GET",
      auth: true,
    });
  },

  async createInvite(email: string, expiresInDays: number) {
    return apiRequest<{ invite: AdminInvite }>("/api/admin/invites", {
      method: "POST",
      auth: true,
      json: { email, expiresInDays },
    });
  },

  async revokeInvite(inviteId: string) {
    return apiRequest<{ success: boolean }>(`/api/admin/invites/${inviteId}/revoke`, {
      method: "POST",
      auth: true,
    });
  },
};
