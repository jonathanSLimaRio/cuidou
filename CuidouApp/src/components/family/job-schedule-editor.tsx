import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { weekdayLabel } from "@/src/lib/marketplace-formatters";
import { defaultScheduleSlot, weekdayOrder } from "@/src/lib/family-jobs";
import type { JobScheduleSlotInput } from "@/src/lib/types/family";
import type { Weekday } from "@/src/lib/types/marketplace";

type JobScheduleEditorProps = {
  value: JobScheduleSlotInput[];
  onChange: (value: JobScheduleSlotInput[]) => void;
  disabled?: boolean;
};

export function JobScheduleEditor({ value, onChange, disabled = false }: JobScheduleEditorProps) {
  const updateSlot = (index: number, patch: Partial<JobScheduleSlotInput>) => {
    onChange(value.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const addSlot = () => {
    onChange([...value, defaultScheduleSlot]);
  };

  const removeSlot = (index: number) => {
    if (value.length <= 1) {
      return;
    }

    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda estruturada</Text>
        <Button
          label="Adicionar horario"
          variant="secondary"
          onPress={addSlot}
          disabled={disabled}
        />
      </View>

      {value.map((slot, index) => (
        <View key={`slot-${index}`} style={styles.slotCard}>
          <Text style={styles.label}>Dia da semana</Text>
          <View style={styles.weekdayRow}>
            {weekdayOrder.map((weekday) => (
              <Pressable
                key={`${index}-${weekday}`}
                disabled={disabled}
                onPress={() => updateSlot(index, { weekday: weekday as Weekday })}
                style={[
                  styles.dayChip,
                  slot.weekday === weekday && styles.dayChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    slot.weekday === weekday && styles.dayChipTextActive,
                  ]}
                >
                  {weekdayLabel(weekday)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeInputWrap}>
              <Text style={styles.label}>Inicio (HH:mm)</Text>
              <TextInput
                editable={!disabled}
                value={slot.startTime}
                onChangeText={(nextValue) => updateSlot(index, { startTime: nextValue })}
                placeholder="08:00"
                placeholderTextColor={appTheme.colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
                maxLength={5}
              />
            </View>

            <View style={styles.timeInputWrap}>
              <Text style={styles.label}>Fim (HH:mm)</Text>
              <TextInput
                editable={!disabled}
                value={slot.endTime}
                onChangeText={(nextValue) => updateSlot(index, { endTime: nextValue })}
                placeholder="12:00"
                placeholderTextColor={appTheme.colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
                maxLength={5}
              />
            </View>
          </View>

          <Button
            label="Remover horario"
            variant="ghost"
            onPress={() => removeSlot(index)}
            disabled={disabled || value.length <= 1}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: appTheme.spacing.sm,
  },
  header: {
    gap: appTheme.spacing.sm,
  },
  title: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.lg,
    fontWeight: appTheme.typography.weight.semibold,
  },
  slotCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.sm,
    gap: appTheme.spacing.sm,
  },
  label: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  weekdayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.xs,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.full,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: appTheme.colors.white,
  },
  dayChipActive: {
    borderColor: appTheme.colors.indigo,
    backgroundColor: "rgba(73,98,199,0.1)",
  },
  dayChipText: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.xs,
  },
  dayChipTextActive: {
    color: appTheme.colors.indigo,
    fontWeight: appTheme.typography.weight.semibold,
  },
  timeRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
  },
  timeInputWrap: {
    flex: 1,
    gap: 4,
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

