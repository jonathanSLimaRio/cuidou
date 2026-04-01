import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

import { LoadingBlock } from "@/src/components/ui/loading-block";
import { useAuth } from "@/src/hooks/use-auth";
import { resolveHomePath } from "@/src/navigation/route-guard";

export default function ProfessionalLayout() {
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

    if (user.role !== "PROFESSIONAL") {
      router.replace(resolveHomePath(user));
    }
  }, [isHydrated, router, user]);

  if (!isHydrated || !user) {
    return <LoadingBlock label="Verificando sessão..." />;
  }

  if (user.role !== "PROFESSIONAL") {
    return <LoadingBlock label="Redirecionando..." />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
