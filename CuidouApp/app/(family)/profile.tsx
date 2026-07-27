import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { ErrorState } from "@/src/components/ui/error-state";
import { Input } from "@/src/components/ui/input";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { familyRepository } from "@/src/lib/api/family-repository";
import type { FamilyProfileInput } from "@/src/lib/types/family";

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Nao foi possivel salvar o perfil.";
}

export default function FamilyProfileScreen() {
  const toast = useToast();
  const profileQuery = useQuery({
    queryKey: ["family-profile"],
    queryFn: () => familyRepository.getFamilyProfile(),
  });

  const [form, setForm] = useState<FamilyProfileInput | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (input: FamilyProfileInput) => familyRepository.updateFamilyProfile(input),
    onSuccess: () => {
      toast.success("Perfil atualizado", "Dados salvos com sucesso.");
      void profileQuery.refetch();
    },
    onError: (error) => {
      toast.error("Falha ao salvar perfil", getErrorMessage(error));
    },
  });

  useEffect(() => {
    if (!profileQuery.isSuccess || form) {
      return;
    }

    const profile = profileQuery.data.profile;
    setForm({
      contactName: profile?.contactName ?? "",
      phone: "",
      bio: profile?.bio ?? "",
      state: profile?.state ?? "",
      city: profile?.city ?? "",
      neighborhood: profile?.neighborhood ?? "",
    });
  }, [form, profileQuery.isSuccess, profileQuery.data?.profile]);

  const submit = () => {
    if (!form) {
      return;
    }

    setValidationError(null);
    if (!form.contactName.trim()) {
      setValidationError("Nome de contato e obrigatorio.");
      return;
    }
    if (!form.state.trim() || !form.city.trim()) {
      setValidationError("Estado e cidade sao obrigatorios.");
      return;
    }

    saveMutation.mutate({
      contactName: form.contactName.trim(),
      phone: form.phone?.trim() || undefined,
      bio: form.bio?.trim() || undefined,
      state: form.state.trim(),
      city: form.city.trim(),
      neighborhood: form.neighborhood?.trim() || undefined,
    });
  };

  return (
    <ScreenShell title="Perfil da familia" subtitle="Atualize contato e localizacao da familia.">
      <Link href="/(family)" asChild>
        <Button label="Voltar ao hub" variant="secondary" />
      </Link>

      {profileQuery.isPending ? <LoadingBlock label="Carregando perfil..." /> : null}
      {profileQuery.isError ? (
        <ErrorState
          title="Falha ao carregar perfil"
          description="Nao foi possivel buscar os dados da familia."
          onRetry={() => profileQuery.refetch()}
        />
      ) : null}

      {!profileQuery.isPending && !profileQuery.isError && form ? (
        <View style={styles.form}>
          {validationError ? <ErrorState title="Validacao" description={validationError} /> : null}

          <Input
            label="Nome de contato"
            value={form.contactName}
            onChangeText={(value) => setForm((current) => (current ? { ...current, contactName: value } : current))}
            maxLength={120}
          />
          <Input
            label="Telefone"
            value={form.phone ?? ""}
            onChangeText={(value) => setForm((current) => (current ? { ...current, phone: value } : current))}
            maxLength={30}
          />
          <Input
            label="Estado"
            value={form.state}
            onChangeText={(value) => setForm((current) => (current ? { ...current, state: value } : current))}
            maxLength={120}
          />
          <Input
            label="Cidade"
            value={form.city}
            onChangeText={(value) => setForm((current) => (current ? { ...current, city: value } : current))}
            maxLength={120}
          />
          <Input
            label="Bairro"
            value={form.neighborhood ?? ""}
            onChangeText={(value) =>
              setForm((current) => (current ? { ...current, neighborhood: value } : current))
            }
            maxLength={120}
          />

          <View style={styles.textAreaWrap}>
            <Input
              label="Bio"
              value={form.bio ?? ""}
              onChangeText={(value) => setForm((current) => (current ? { ...current, bio: value } : current))}
              multiline
              numberOfLines={4}
              maxLength={1200}
              style={styles.textArea}
            />
          </View>

          <Button
            label="Salvar perfil"
            onPress={submit}
            loading={saveMutation.isPending}
          />
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  form: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
  },
  textAreaWrap: {
    gap: 6,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: appTheme.spacing.sm,
  },
});
