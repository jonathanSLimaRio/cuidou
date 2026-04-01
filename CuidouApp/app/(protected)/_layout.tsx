import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

import { LoadingBlock } from "@/src/components/ui/loading-block";
import { useAuth } from "@/src/hooks/use-auth";
import { resolveHomePath } from "@/src/navigation/route-guard";

export default function ProtectedLayout() {
  const router = useRouter();
  const { isHydrated, user } = useAuth();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user) {
      router.replace("/(public)/login");
      return;
    }

    if (user.role === "FAMILY" || user.role === "PROFESSIONAL") {
      router.replace(resolveHomePath(user));
    }
  }, [isHydrated, router, user]);

  if (!isHydrated) {
    return <LoadingBlock label="Validando acesso..." />;
  }

  if (!user) {
    return <LoadingBlock label="Redirecionando para login..." />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
