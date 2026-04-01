import { ScreenShell } from "@/src/components/ui/screen-shell";
import { EmptyState } from "@/src/components/ui/empty-state";

export default function UnsupportedRoleScreen() {
  return (
    <ScreenShell
      title="Perfil não suportado no app"
      subtitle="Este app mobile cobre apenas fluxos FAMILY e PROFESSIONAL nesta fase."
    >
      <EmptyState
        title="Acesso restrito"
        description="Seu papel atual não possui área dedicada no aplicativo mobile ainda."
      />
    </ScreenShell>
  );
}
