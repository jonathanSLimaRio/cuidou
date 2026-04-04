import { apiRequest } from "@/src/lib/api/client";

export const pushTokenRepository = {
  async registerToken(token: string, platform: string): Promise<void> {
    await apiRequest<{ success: boolean }>("/api/push-token", {
      method: "POST",
      auth: true,
      json: { token, platform },
    });
  },

  async removeToken(token: string): Promise<void> {
    await apiRequest<{ success: boolean }>("/api/push-token", {
      method: "DELETE",
      auth: true,
      json: { token },
    });
  },
};
