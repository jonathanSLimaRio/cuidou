import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { ErrorState } from "@/src/components/ui/error-state";
import { Input } from "@/src/components/ui/input";
import { JobScheduleEditor } from "@/src/components/family/job-schedule-editor";
import { defaultScheduleSlot, hasInvalidSchedule } from "@/src/lib/family-jobs";
import { serviceTypeLabel } from "@/src/lib/marketplace-formatters";
import type { FamilyJobPayload } from "@/src/lib/types/family";
import type { JobStatus, ServiceType } from "@/src/lib/types/marketplace";

type FormModel = {
  serviceType: ServiceType;
  title: string;
  description: string;
  state: string;
  city: string;
  neighborhood: string;
  hourlyRateMin: string;
  hourlyRateMax: string;
  scheduleDetails: string;
  scheduleSlots: FamilyJobPayload["scheduleSlots"];
  status?: JobStatus;
};

type FamilyJobFormProps = {
  mode: "create" | "edit";
  initialValue?: Partial<FamilyJobPayload> & { status?: JobStatus };
  loading?: boolean;
  submitLabel: string;
  onSubmit: (payload: FamilyJobPayload) => void;
};

const serviceTypes: ServiceType[] = ["BABYSITTER", "ELDER_CAREGIVER"];
const editableStatuses: JobStatus[] = ["OPEN", "PAUSED", "ARCHIVED", "CLOSED"];

function parsePositiveInteger(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return NaN;
  }
  return parsed;
}

function toInitialForm(initialValue?: Partial<FamilyJobPayload> & { status?: JobStatus }): FormModel {
  return {
    serviceType: initialValue?.serviceType ?? "BABYSITTER",
    title: initialValue?.title ?? "",
    description: initialValue?.description ?? "",
    state: initialValue?.state ?? "",
    city: initialValue?.city ?? "",
    neighborhood: initialValue?.neighborhood ?? "",
    hourlyRateMin: initialValue?.hourlyRateMin?.toString() ?? "",
    hourlyRateMax: initialValue?.hourlyRateMax?.toString() ?? "",
    scheduleDetails: initialValue?.scheduleDetails ?? "",
    scheduleSlots:
      initialValue?.scheduleSlots && initialValue.scheduleSlots.length > 0
        ? initialValue.scheduleSlots
        : [defaultScheduleSlot],
    status: initialValue?.status ?? "OPEN",
  };
}

export function FamilyJobForm({
  mode,
  initialValue,
  loading = false,
  submitLabel,
  onSubmit,
}: FamilyJobFormProps) {
  const [form, setForm] = useState<FormModel>(() => toInitialForm(initialValue));
  const [validationError, setValidationError] = useState<string | null>(null);

  const isScheduleInvalid = useMemo(() => hasInvalidSchedule(form.scheduleSlots), [form.scheduleSlots]);

  const isRateRangeInvalid = useMemo(() => {
    const min = parsePositiveInteger(form.hourlyRateMin);
    const max = parsePositiveInteger(form.hourlyRateMax);
    if (Number.isNaN(min) || Number.isNaN(max)) {
      return true;
    }
    if (min === undefined || max === undefined) {
      return false;
    }
    return min > max;
  }, [form.hourlyRateMax, form.hourlyRateMin]);

  const submit = () => {
    setValidationError(null);

    if (!form.title.trim() || form.title.trim().length < 5) {
      setValidationError("Informe um titulo com pelo menos 5 caracteres.");
      return;
    }

    if (!form.description.trim() || form.description.trim().length < 20) {
      setValidationError("Informe uma descricao com pelo menos 20 caracteres.");
      return;
    }

    if (!form.state.trim() || !form.city.trim()) {
      setValidationError("Estado e cidade sao obrigatorios.");
      return;
    }

    if (isScheduleInvalid) {
      setValidationError("A agenda esta invalida. Revise horarios, formato HH:mm e duplicidades.");
      return;
    }

    if (isRateRangeInvalid) {
      setValidationError("A faixa de valor por hora esta invalida.");
      return;
    }

    const min = parsePositiveInteger(form.hourlyRateMin);
    const max = parsePositiveInteger(form.hourlyRateMax);

    onSubmit({
      serviceType: form.serviceType,
      title: form.title.trim(),
      description: form.description.trim(),
      state: form.state.trim(),
      city: form.city.trim(),
      neighborhood: form.neighborhood.trim() || undefined,
      hourlyRateMin: min === undefined ? undefined : min,
      hourlyRateMax: max === undefined ? undefined : max,
      scheduleDetails: form.scheduleDetails.trim() || undefined,
      scheduleSlots: form.scheduleSlots,
      ...(mode === "edit" ? { status: form.status } : {}),
    });
  };

  return (
    <View style={styles.form}>
      {validationError ? <ErrorState title="Validacao" description={validationError} /> : null}

      <Text style={styles.label}>Tipo de servico</Text>
      <View style={styles.row}>
        {serviceTypes.map((serviceType) => (
          <Pressable
            key={serviceType}
            disabled={loading}
            onPress={() => setForm((current) => ({ ...current, serviceType }))}
            style={[
              styles.chip,
              form.serviceType === serviceType && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                form.serviceType === serviceType && styles.chipTextActive,
              ]}
            >
              {serviceTypeLabel(serviceType)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Titulo"
        testID="job-title-input"
        value={form.title}
        onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
        maxLength={160}
      />

      <View style={styles.textAreaWrap}>
        <Text style={styles.label}>Descricao</Text>
        <TextInput
          testID="job-description-input"
          editable={!loading}
          value={form.description}
          onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
          placeholderTextColor={appTheme.colors.textMuted}
          style={styles.textArea}
          maxLength={4000}
          multiline
          numberOfLines={5}
        />
      </View>

      <Input
        label="Estado"
        testID="job-state-input"
        value={form.state}
        onChangeText={(value) => setForm((current) => ({ ...current, state: value }))}
        maxLength={120}
      />
      <Input
        label="Cidade"
        testID="job-city-input"
        value={form.city}
        onChangeText={(value) => setForm((current) => ({ ...current, city: value }))}
        maxLength={120}
      />
      <Input
        label="Bairro"
        value={form.neighborhood}
        onChangeText={(value) => setForm((current) => ({ ...current, neighborhood: value }))}
        maxLength={120}
      />
      <Input
        label="Valor minimo por hora (opcional)"
        value={form.hourlyRateMin}
        onChangeText={(value) => setForm((current) => ({ ...current, hourlyRateMin: value }))}
        keyboardType="number-pad"
      />
      <Input
        label="Valor maximo por hora (opcional)"
        value={form.hourlyRateMax}
        onChangeText={(value) => setForm((current) => ({ ...current, hourlyRateMax: value }))}
        keyboardType="number-pad"
      />

      <View style={styles.textAreaWrap}>
        <Text style={styles.label}>Observacoes de agenda (opcional)</Text>
        <TextInput
          editable={!loading}
          value={form.scheduleDetails}
          onChangeText={(value) => setForm((current) => ({ ...current, scheduleDetails: value }))}
          placeholderTextColor={appTheme.colors.textMuted}
          style={styles.textAreaSmall}
          maxLength={1000}
          multiline
          numberOfLines={3}
        />
      </View>

      <JobScheduleEditor
        value={form.scheduleSlots}
        onChange={(scheduleSlots) => setForm((current) => ({ ...current, scheduleSlots }))}
        disabled={loading}
      />

      {mode === "edit" ? (
        <View style={styles.statusBlock}>
          <Text style={styles.label}>Status da vaga</Text>
          <View style={styles.row}>
            {editableStatuses.map((status) => (
              <Pressable
                key={status}
                disabled={loading}
                onPress={() => setForm((current) => ({ ...current, status }))}
                style={[
                  styles.chip,
                  form.status === status && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    form.status === status && styles.chipTextActive,
                  ]}
                >
                  {status}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Button label={submitLabel} testID="job-submit-button" onPress={submit} loading={loading} />
    </View>
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
  row: {
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
  chipText: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  chipTextActive: {
    color: appTheme.colors.indigo,
    fontWeight: appTheme.typography.weight.semibold,
  },
  textAreaWrap: {
    gap: 6,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    padding: appTheme.spacing.md,
    textAlignVertical: "top",
    fontSize: appTheme.typography.size.md,
    lineHeight: 22,
  },
  textAreaSmall: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    padding: appTheme.spacing.md,
    textAlignVertical: "top",
    fontSize: appTheme.typography.size.md,
    lineHeight: 20,
  },
  statusBlock: {
    gap: appTheme.spacing.sm,
  },
});
