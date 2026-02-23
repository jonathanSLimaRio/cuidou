"use client";

import { ActionButton } from "@/components/theme/action-button";
import { timeToMinutes, WEEKDAY_LABEL, WEEKDAY_ORDER } from "@/lib/job-schedule";
import { Weekday } from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";

export type JobScheduleSlotDraft = {
  weekday: Weekday;
  startTime: string;
  endTime: string;
};

type Props = {
  value: JobScheduleSlotDraft[];
  onChange: (nextValue: JobScheduleSlotDraft[]) => void;
  disabled?: boolean;
};

const defaultSlot: JobScheduleSlotDraft = {
  weekday: "MONDAY",
  startTime: "08:00",
  endTime: "12:00",
};

function hasInvalidRange(slot: JobScheduleSlotDraft) {
  if (!slot.startTime || !slot.endTime) {
    return true;
  }

  return timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime);
}

export function JobScheduleEditor({ value, onChange, disabled = false }: Props) {
  const duplicateKeys = new Set<string>();
  const duplicatedIndexes = new Set<number>();

  value.forEach((slot, index) => {
    const key = `${slot.weekday}:${slot.startTime}:${slot.endTime}`;
    if (duplicateKeys.has(key)) {
      duplicatedIndexes.add(index);
    }
    duplicateKeys.add(key);
  });

  function updateSlot(index: number, patch: Partial<JobScheduleSlotDraft>) {
    onChange(value.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  }

  function addSlot() {
    onChange([...value, defaultSlot]);
  }

  function removeSlot(index: number) {
    onChange(value.filter((_, idx) => idx !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--theme-body)]">
          Defina os dias e horários recorrentes desta vaga.
        </p>
        <ActionButton type="button" icon={Plus} size="sm" variant="secondary" onClick={addSlot} disabled={disabled}>
          Adicionar horário
        </ActionButton>
      </div>

      <div className="space-y-2">
        {value.map((slot, index) => {
          const invalidRange = hasInvalidRange(slot);
          const duplicated = duplicatedIndexes.has(index);

          return (
            <div key={`slot-${index}`} className="rounded-2xl border border-[var(--theme-border)] bg-white p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.05em] text-[var(--theme-muted)]">Dia</span>
                  <select
                    className="theme-select"
                    value={slot.weekday}
                    onChange={(event) => updateSlot(index, { weekday: event.target.value as Weekday })}
                    disabled={disabled}
                  >
                    {WEEKDAY_ORDER.map((weekday) => (
                      <option key={weekday} value={weekday}>
                        {WEEKDAY_LABEL[weekday]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.05em] text-[var(--theme-muted)]">Início</span>
                  <input
                    type="time"
                    className="theme-field min-w-28"
                    value={slot.startTime}
                    onChange={(event) => updateSlot(index, { startTime: event.target.value })}
                    disabled={disabled}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.05em] text-[var(--theme-muted)]">Fim</span>
                  <input
                    type="time"
                    className="theme-field min-w-28"
                    value={slot.endTime}
                    onChange={(event) => updateSlot(index, { endTime: event.target.value })}
                    disabled={disabled}
                  />
                </label>

                <ActionButton
                  type="button"
                  icon={Trash2}
                  size="sm"
                  variant="secondary"
                  onClick={() => removeSlot(index)}
                  disabled={disabled || value.length <= 1}
                  className="sm:mb-0.5"
                >
                  Remover
                </ActionButton>
              </div>

              {invalidRange ? (
                <p className="mt-2 text-xs text-[var(--theme-danger)]">O horário final deve ser maior que o inicial.</p>
              ) : null}
              {duplicated ? (
                <p className="mt-2 text-xs text-[var(--theme-danger)]">Há outro horário igual nesta agenda.</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
