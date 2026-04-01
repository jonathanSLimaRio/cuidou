import { useAuthContext } from "@/src/providers/auth-provider";

export function useAuth() {
  return useAuthContext();
}
