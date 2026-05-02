"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { Shift, Weekday } from "@/lib/prisma-enums";
import { Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type SlotInput = {
  weekday: Weekday;
  shift: Shift;
  isAvailable: boolean;
};

type ExceptionInput = {
  date: string;
  shift: Shift;
  isAvailable: boolean;
  note?: string | null;
};

type Props = {
  initialWeeklySlots: SlotInput[];
  initialExceptions: ExceptionInput[];
  legacyAvailabilityText?: string | null;
};

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

const weekdayLabel: Record<Weekday, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

const shiftLabel: Record<Shift, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  EVENING: "Noite",
  OVERNIGHT: "Madrugada",
};

function buildInitialMatrix(slots: SlotInput[]) {
  const matrix: Record<Weekday, Record<Shift, boolean>> = {
    MONDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
    TUESDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
    WEDNESDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
    THURSDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
    FRIDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
    SATURDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
    SUNDAY: { MORNING: false, AFTERNOON: false, EVENING: false, OVERNIGHT: false },
  };

  for (const slot of slots) {
    matrix[slot.weekday][slot.shift] = slot.isAvailable;
  }

  return matrix;
}

export function AvailabilityManager({
  initialWeeklySlots,
  initialExceptions,
  legacyAvailabilityText,
}: Props) {
  const { error: showError, success } = useToast();
  const [matrix, setMatrix] = useState<Record<Weekday, Record<Shift, boolean>>>(() =>
    buildInitialMatrix(initialWeeklySlots),
  );
  const [exceptions, setExceptions] = useState<ExceptionInput[]>(initialExceptions);
  const [saving, setSaving] = useState(false);

  const weeklySlots = useMemo(
    () =>
      weekdays.flatMap((weekday) =>
        shifts.map((shift) => ({
          weekday,
          shift,
          isAvailable: matrix[weekday][shift],
        })),
      ),
    [matrix],
  );

  function toggle(weekday: Weekday, shift: Shift) {
    setMatrix((current) => ({
      ...current,
      [weekday]: {
        ...current[weekday],
        [shift]: !current[weekday][shift],
      },
    }));
  }

  function addException() {
    setExceptions((current) => [
      ...current,
      {
        date: "",
        shift: "MORNING",
        isAvailable: false,
        note: "",
      },
    ]);
  }

  function updateException(index: number, patch: Partial<ExceptionInput>) {
    setExceptions((current) =>
      current.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    );
  }

  function removeException(index: number) {
    setExceptions((current) => current.filter((_, idx) => idx !== index));
  }

  async function save() {
    setSaving(true);

    try {
      const payload = {
        weeklySlots,
        exceptions: exceptions.filter((item) => item.date.trim().length > 0),
      };

      const response = await fetch("/api/professional/availability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        showError("Falha ao salvar agenda.", result.error);
        return;
      }

      success("Agenda salva com sucesso.");
    } catch {
      showError("Erro inesperado ao salvar agenda.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="theme-card rounded-[34px] px-6 py-8 sm:px-8">
      <p className="theme-chip theme-chip-blue w-fit">Agenda semanal</p>
      <h2 className="mt-4 text-3xl">Disponibilidade por turnos</h2>
      <p className="mt-2 text-sm text-[var(--theme-body)]">
        Defina sua disponibilidade por dia da semana e turnos fixos.
      </p>

      {legacyAvailabilityText ? (
        <p className="theme-alert theme-alert-warning mt-4">
          Disponibilidade legada (texto): {legacyAvailabilityText}
        </p>
      ) : null}

      <div className="theme-table-wrap mt-5">
        <table className="theme-table min-w-[640px]">
          <thead>
            <tr>
              <th>Dia</th>
              {shifts.map((shift) => (
                <th key={shift} className="text-center">
                  {shiftLabel[shift]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekdays.map((weekday) => (
              <tr key={weekday}>
                <td className="font-display text-[var(--theme-navy)]">{weekdayLabel[weekday]}</td>
                {shifts.map((shift) => (
                  <td key={`${weekday}-${shift}`} className="text-center">
                    <input
                      type="checkbox"
                      checked={matrix[weekday][shift]}
                      onChange={() => toggle(weekday, shift)}
                      className="h-4 w-4 rounded border-[var(--theme-border)] text-[var(--theme-indigo)]"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl">Exceções por data</h3>
            <p className="mt-1 text-sm text-[var(--theme-muted)]">
              Use para bloquear ou liberar turnos em dias específicos.
            </p>
          </div>
          <ActionButton type="button" onClick={addException} icon={Plus} variant="secondary" size="sm">
            Adicionar exceção
          </ActionButton>
        </div>

        <div className="mt-3 space-y-3">
          {exceptions.map((item, index) => (
            <div
              key={`exception-${index}`}
              className="grid gap-2 rounded-2xl border border-[var(--theme-border)] bg-white p-3 sm:grid-cols-5"
            >
              <input
                type="date"
                value={item.date}
                onChange={(event) => updateException(index, { date: event.target.value })}
                className="theme-field"
              />
              <select
                value={item.shift}
                onChange={(event) => updateException(index, { shift: event.target.value as Shift })}
                className="theme-select"
              >
                {shifts.map((shift) => (
                  <option key={shift} value={shift}>
                    {shiftLabel[shift]}
                  </option>
                ))}
              </select>
              <select
                value={item.isAvailable ? "available" : "unavailable"}
                onChange={(event) =>
                  updateException(index, { isAvailable: event.target.value === "available" })
                }
                className="theme-select"
              >
                <option value="unavailable">Indisponível</option>
                <option value="available">Disponível</option>
              </select>
              <input
                type="text"
                value={item.note ?? ""}
                placeholder="Observação"
                onChange={(event) => updateException(index, { note: event.target.value })}
                className="theme-field"
              />
              <ActionButton
                type="button"
                onClick={() => removeException(index)}
                icon={Trash2}
                variant="secondary"
                size="sm"
              >
                Remover
              </ActionButton>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-3 mt-5 flex justify-end">
        <ActionButton
          type="button"
          icon={Save}
          disabled={saving}
          onClick={save}
          className="min-w-40 shadow-[var(--theme-shadow-md)] disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar agenda"}
        </ActionButton>
      </div>
    </section>
  );
}
