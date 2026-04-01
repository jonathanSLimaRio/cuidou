import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { professionalRepository } from "@/src/lib/api/professional-repository";
import { shiftLabel, weekdayLabel } from "@/src/lib/professional-formatters";
import type { AvailabilityException, AvailabilitySlot } from "@/src/lib/types/professional";
import type { Shift, Weekday } from "@/src/lib/types/marketplace";

const weekdays: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const shifts: Shift[] = ["MORNING", "AFTERNOON", "EVENING", "OVERNIGHT"];

function mapError(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Não foi possível salvar a disponibilidade.";
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

export default function ProfessionalAvailabilityScreen() {
  const toast = useToast();
  const availabilityQuery = useQuery({
    queryKey: ["professional-availability"],
    queryFn: () => professionalRepository.getAvailability(),
  });

  const [matrix, setMatrix] = useState<Record<Weekday, Record<Shift, boolean>> | null>(null);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!availabilityQuery.data || matrix) {
      return;
    }

    const nextMatrix: Record<Weekday, Record<Shift, boolean>> = {
      MONDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
      TUESDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
      WEDNESDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
      THURSDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
      FRIDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
      SATURDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
      SUNDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
    };

    availabilityQuery.data.weeklySlots.forEach((slot) => {
      nextMatrix[slot.weekday][slot.shift] = slot.isAvailable;
    });

    setMatrix(nextMatrix);
    setExceptions(availabilityQuery.data.exceptions);
  }, [availabilityQuery.data, matrix]);

  const weeklySlots = useMemo<AvailabilitySlot[]>(() => {
    if (!matrix) {
      return [];
    }
    return weekdays.flatMap((weekday) =>
      shifts.map((shift) => ({
        weekday,
        shift,
        isAvailable: matrix[weekday][shift],
      })),
    );
  }, [matrix]);

  const saveMutation = useMutation({
    mutationFn: () =>
      professionalRepository.updateAvailability({
        weeklySlots,
        exceptions: exceptions.filter((item) => item.date.trim()),
      }),
    onSuccess: () => {
      toast.success("Disponibilidade salva", "Sua agenda foi atualizada.");
      void availabilityQuery.refetch();
    },
    onError: (error) => {
      toast.error("Falha ao salvar disponibilidade", mapError(error));
    },
  });

  const toggleSlot = (weekday: Weekday, shift: Shift) => {
    if (!matrix) {
      return;
    }
    setMatrix({
      ...matrix,
      [weekday]: {
        ...matrix[weekday],
        [shift]: !matrix[weekday][shift],
      },
    });
  };

  const addException = () => {
    setExceptions((current) => [
      ...current,
      {
        date: "",
        shift: "MORNING",
        isAvailable: false,
        note: "",
      },
    ]);
  };

  const updateException = (index: number, patch: Partial<AvailabilityException>) => {
    setExceptions((current) =>
      current.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    );
  };

  const removeException = (index: number) => {
    setExceptions((current) => current.filter((_, idx) => idx !== index));
  };

  const onSave = () => {
    setLocalError(null);
    const validExceptions = exceptions.filter((item) => item.date.trim());
    const duplicated = new Set<string>();
    for (const item of validExceptions) {
      if (!isValidDateInput(item.date)) {
        setLocalError("Use datas válidas no formato YYYY-MM-DD nas exceções.");
        return;
      }

      const key = `${item.date}:${item.shift}`;
      if (duplicated.has(key)) {
        setLocalError("Existem exceções duplicadas para a mesma data e turno.");
        return;
      }
      duplicated.add(key);
    }
    saveMutation.mutate();
  };

  return (
    <ScreenShell
      title="Disponibilidade"
      subtitle="Defina agenda semanal e exceções por data para melhorar o matching."
    >
      <Link href="/(professional)" asChild>
        <Button label="Voltar ao hub" variant="secondary" />
      </Link>

      {availabilityQuery.isPending ? <LoadingBlock label="Carregando disponibilidade..." /> : null}
      {availabilityQuery.isError ? (
        <ErrorState
          title="Falha ao carregar disponibilidade"
          description="Não foi possível recuperar sua agenda."
          onRetry={() => availabilityQuery.refetch()}
        />
      ) : null}

      {!availabilityQuery.isPending && !availabilityQuery.isError && !matrix ? (
        <EmptyState title="Sem disponibilidade" description="Configure seus turnos para começar." />
      ) : null}

      {!availabilityQuery.isPending && !availabilityQuery.isError && matrix ? (
        <View style={styles.panel}>
          {localError ? <ErrorState title="Validação" description={localError} /> : null}
          <Text style={styles.heading}>Agenda semanal</Text>
          {weekdays.map((weekday) => (
            <View key={weekday} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{weekdayLabel(weekday)}</Text>
              <View style={styles.slotRow}>
                {shifts.map((shift) => (
                  <Pressable
                    key={`${weekday}-${shift}`}
                    style={[
                      styles.slotChip,
                      matrix[weekday][shift] && styles.slotChipActive,
                    ]}
                    onPress={() => toggleSlot(weekday, shift)}
                  >
                    <Text
                      style={[
                        styles.slotChipText,
                        matrix[weekday][shift] && styles.slotChipTextActive,
                      ]}
                    >
                      {shiftLabel(shift)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.exceptionHeader}>
            <Text style={styles.heading}>Exceções</Text>
            <Button label="Adicionar exceção" variant="secondary" onPress={addException} />
          </View>
          {exceptions.length === 0 ? (
            <EmptyState
              title="Sem exceções cadastradas"
              description="Adicione exceções para bloquear ou liberar turnos em datas específicas."
            />
          ) : (
            exceptions.map((item, index) => (
              <View key={`exception-${index}`} style={styles.exceptionCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Data (YYYY-MM-DD)"
                  value={item.date}
                  onChangeText={(value) => updateException(index, { date: value })}
                />
                <View style={styles.slotRow}>
                  {shifts.map((shift) => (
                    <Pressable
                      key={`exception-${index}-${shift}`}
                      onPress={() => updateException(index, { shift })}
                      style={[
                        styles.slotChip,
                        item.shift === shift && styles.slotChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotChipText,
                          item.shift === shift && styles.slotChipTextActive,
                        ]}
                      >
                        {shiftLabel(shift)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.slotRow}>
                  <Pressable
                    onPress={() => updateException(index, { isAvailable: false })}
                    style={[styles.slotChip, !item.isAvailable && styles.slotChipActive]}
                  >
                    <Text
                      style={[
                        styles.slotChipText,
                        !item.isAvailable && styles.slotChipTextActive,
                      ]}
                    >
                      Indisponível
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => updateException(index, { isAvailable: true })}
                    style={[styles.slotChip, item.isAvailable && styles.slotChipActive]}
                  >
                    <Text
                      style={[
                        styles.slotChipText,
                        item.isAvailable && styles.slotChipTextActive,
                      ]}
                    >
                      Disponível
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Observação (opcional)"
                  value={item.note ?? ""}
                  onChangeText={(value) => updateException(index, { note: value })}
                />
                <Button label="Remover exceção" variant="ghost" onPress={() => removeException(index)} />
              </View>
            ))
          )}
          <Button
            label="Salvar disponibilidade"
            onPress={onSave}
            loading={saveMutation.isPending}
          />
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
  },
  heading: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.lg,
    fontWeight: appTheme.typography.weight.semibold,
  },
  dayRow: {
    gap: 6,
  },
  dayLabel: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.md,
    fontWeight: appTheme.typography.weight.semibold,
  },
  slotRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.sm,
  },
  slotChip: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.full,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
    backgroundColor: appTheme.colors.white,
  },
  slotChipActive: {
    borderColor: appTheme.colors.indigo,
    backgroundColor: "rgba(73,98,199,0.1)",
  },
  slotChipText: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  slotChipTextActive: {
    color: appTheme.colors.indigo,
    fontWeight: appTheme.typography.weight.semibold,
  },
  exceptionHeader: {
    marginTop: appTheme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  exceptionCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.sm,
    gap: appTheme.spacing.sm,
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
});
