import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

import { LoadingBlock } from "@/src/components/ui/loading-block";
import { useAuth } from "@/src/hooks/use-auth";
import { isLegalPath, resolveHomePath } from "@/src/navigation/route-guard";

export default function PublicLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { isHydrated, user, status } = useAuth();

  useEffect(() => {
    if (!isHydrated || !user || isLegalPath(pathname)) {
      return;
    }

    router.replace(resolveHomePath(user));
  }, [isHydrated, pathname, router, user]);

  if (!isHydrated || (status === "refreshing" && !user)) {
    return <LoadingBlock label="Carregando sessão..." />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
