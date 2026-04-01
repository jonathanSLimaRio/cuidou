import { Redirect } from "expo-router";

import { LoadingBlock } from "@/src/components/ui/loading-block";
import { useAuth } from "@/src/hooks/use-auth";
import { resolveHomePath } from "@/src/navigation/route-guard";

export default function IndexRoute() {
  const { isHydrated, user } = useAuth();

  if (!isHydrated) {
    return <LoadingBlock label="Preparando app..." />;
  }

  return <Redirect href={resolveHomePath(user)} />;
}
