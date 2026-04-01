import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

import { LoadingBlock } from "@/src/components/ui/loading-block";
import { useAuth } from "@/src/hooks/use-auth";

export default function AdminLayout() {
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

    if (user.role !== "ADMIN") {
      router.replace("/(public)/login");
    }
  }, [isHydrated, router, user]);

  if (!isHydrated || !user) {
    return <LoadingBlock label="Verificando sessão..." />;
  }

  if (user.role !== "ADMIN") {
    return <LoadingBlock label="Redirecionando..." />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
