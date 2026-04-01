import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { professionalRepository } from "@/src/lib/api/professional-repository";
import { serviceTypeLabel } from "@/src/lib/marketplace-formatters";
import type { ServiceType } from "@/src/lib/types/marketplace";

type FormState = {
  bio: string;
  experienceYears: string;
  serviceTypes: ServiceType[];
  state: string;
  city: string;
  neighborhood: string;
  hourlyRateMin: string;
  hourlyRateMax: string;
  phone: string;
};

function mapError(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Não foi possível salvar o perfil.";
}

const serviceOptions: ServiceType[] = ["BABYSITTER", "ELDER_CAREGIVER"];

export default function ProfessionalProfileScreen() {
  const toast = useToast();

  const profileQuery = useQuery({
    queryKey: ["professional-profile"],
    queryFn: () => professionalRepository.getProfile(),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const profile = profileQuery.data?.profile;

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!form) {
        throw new Error("invalid_form_state");
      }

      return professionalRepository.updateProfile({
        bio: form.bio.trim() || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        serviceTypes: form.serviceTypes,
        state: form.state.trim(),
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim() || undefined,
        hourlyRateMin: form.hourlyRateMin ? Number(form.hourlyRateMin) : undefined,
        hourlyRateMax: form.hourlyRateMax ? Number(form.hourlyRateMax) : undefined,
        phone: form.phone.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Perfil salvo", "Dados atualizados com sucesso.");
      void profileQuery.refetch();
    },
    onError: (error) => {
      toast.error("Falha ao salvar perfil", mapError(error));
    },
  });

  useEffect(() => {
    if (!profileQuery.isSuccess || form) {
      return;
    }

    setForm({
      bio: profile?.bio ?? "",
      experienceYears: profile?.experienceYears?.toString() ?? "",
      serviceTypes: profile?.serviceTypes ?? [],
      state: profile?.state ?? "",
      city: profile?.city ?? "",
      neighborhood: profile?.neighborhood ?? "",
      hourlyRateMin: profile?.hourlyRateMin?.toString() ?? "",
      hourlyRateMax: profile?.hourlyRateMax?.toString() ?? "",
      phone: "",
    });
  }, [form, profile, profileQuery.isSuccess]);

  const onToggleService = (service: ServiceType) => {
    if (!form) {
      return;
    }
    const exists = form.serviceTypes.includes(service);
    setForm({
      ...form,
      serviceTypes: exists
        ? form.serviceTypes.filter((item) => item !== service)
        : [...form.serviceTypes, service],
    });
  };

  const submit = () => {
    if (!form) {
      return;
    }
    setLocalError(null);

    if (form.serviceTypes.length === 0) {
      setLocalError("Selecione pelo menos uma especialidade.");
      return;
    }

    if (!form.state.trim() || !form.city.trim()) {
      setLocalError("Estado e cidade são obrigatórios.");
      return;
    }

    const min = form.hourlyRateMin ? Number(form.hourlyRateMin) : undefined;
    const max = form.hourlyRateMax ? Number(form.hourlyRateMax) : undefined;
    if (min !== undefined && max !== undefined && min > max) {
      setLocalError("O valor mínimo não pode ser maior que o máximo.");
      return;
    }

    saveMutation.mutate();
  };

  return (
    <ScreenShell
      title="Perfil profissional"
      subtitle="Edite seus dados para melhorar compatibilidade com vagas e convites."
    >
      <Link href="/(professional)" asChild>
        <Button label="Voltar ao hub" variant="secondary" />
      </Link>

      {profileQuery.isPending ? <LoadingBlock label="Carregando perfil..." /> : null}
      {profileQuery.isError ? (
        <ErrorState
          title="Falha ao carregar perfil"
          description="Não foi possível recuperar seus dados."
          onRetry={() => profileQuery.refetch()}
        />
      ) : null}

      {!profileQuery.isPending && !profileQuery.isError && form ? (
        <View style={styles.form}>
          {localError ? (
            <ErrorState title="Validação" description={localError} />
          ) : null}

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.textArea}
            value={form?.bio}
            onChangeText={(value) => setForm((current) => (current ? { ...current, bio: value } : current))}
            multiline
            numberOfLines={4}
            maxLength={2000}
          />

          <Text style={styles.label}>Especialidades</Text>
          <View style={styles.chipRow}>
            {serviceOptions.map((service) => (
              <Pressable
                key={service}
                onPress={() => onToggleService(service)}
                style={[
                  styles.chip,
                  form?.serviceTypes.includes(service) && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    form?.serviceTypes.includes(service) && styles.chipLabelActive,
                  ]}
                >
                  {serviceTypeLabel(service)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Anos de experiência</Text>
          <TextInput
            style={styles.input}
            value={form?.experienceYears}
            onChangeText={(value) =>
              setForm((current) => (current ? { ...current, experienceYears: value } : current))
            }
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Estado</Text>
          <TextInput
            style={styles.input}
            value={form?.state}
            onChangeText={(value) => setForm((current) => (current ? { ...current, state: value } : current))}
            maxLength={120}
          />

          <Text style={styles.label}>Cidade</Text>
          <TextInput
            style={styles.input}
            value={form?.city}
            onChangeText={(value) => setForm((current) => (current ? { ...current, city: value } : current))}
            maxLength={120}
          />

          <Text style={styles.label}>Bairro</Text>
          <TextInput
            style={styles.input}
            value={form?.neighborhood}
            onChangeText={(value) =>
              setForm((current) => (current ? { ...current, neighborhood: value } : current))
            }
            maxLength={120}
          />

          <Text style={styles.label}>Valor mínimo por hora</Text>
          <TextInput
            style={styles.input}
            value={form?.hourlyRateMin}
            onChangeText={(value) =>
              setForm((current) => (current ? { ...current, hourlyRateMin: value } : current))
            }
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Valor máximo por hora</Text>
          <TextInput
            style={styles.input}
            value={form?.hourlyRateMax}
            onChangeText={(value) =>
              setForm((current) => (current ? { ...current, hourlyRateMax: value } : current))
            }
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={form?.phone}
            onChangeText={(value) => setForm((current) => (current ? { ...current, phone: value } : current))}
            maxLength={30}
          />

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
  label: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    paddingHorizontal: appTheme.spacing.md,
    fontSize: appTheme.typography.size.md,
  },
  textArea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    padding: appTheme.spacing.md,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.full,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
    backgroundColor: appTheme.colors.white,
  },
  chipActive: {
    borderColor: appTheme.colors.indigo,
    backgroundColor: "rgba(73,98,199,0.1)",
  },
  chipLabel: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  chipLabelActive: {
    color: appTheme.colors.indigo,
    fontWeight: appTheme.typography.weight.semibold,
  },
});
