import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { Button } from "@/src/components/ui/button";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { FamilyJobForm } from "@/src/components/family/job-form";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { familyRepository } from "@/src/lib/api/family-repository";
import type { FamilyJobPayload } from "@/src/lib/types/family";

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Nao foi possivel criar a vaga.";
}

export default function FamilyJobCreateScreen() {
  const router = useRouter();
  const toast = useToast();

  const createMutation = useMutation({
    mutationFn: (payload: FamilyJobPayload) => familyRepository.createJob(payload),
    onSuccess: (result) => {
      toast.success("Vaga criada", "A vaga foi publicada com sucesso.");
      router.replace(`/(family)/jobs/${result.job.id}/edit`);
    },
    onError: (error) => {
      toast.error("Falha ao criar vaga", getErrorMessage(error));
    },
  });

  return (
    <ScreenShell title="Nova vaga" subtitle="Publique uma vaga com agenda estruturada.">
      <Button label="Voltar para vagas" variant="secondary" onPress={() => router.replace("/(family)/jobs")} />
      <FamilyJobForm
        mode="create"
        submitLabel="Criar vaga"
        loading={createMutation.isPending}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </ScreenShell>
  );
}

