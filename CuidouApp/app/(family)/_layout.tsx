import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

import { LoadingBlock } from "@/src/components/ui/loading-block";
import { useAuth } from "@/src/hooks/use-auth";
import { resolveHomePath } from "@/src/navigation/route-guard";

export default function FamilyLayout() {
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

    if (user.role !== "FAMILY") {
      router.replace(resolveHomePath(user));
    }
  }, [isHydrated, router, user]);

  if (!isHydrated || !user) {
    return <LoadingBlock label="Verificando sessão..." />;
  }

  if (user.role !== "FAMILY") {
    return <LoadingBlock label="Redirecionando..." />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
