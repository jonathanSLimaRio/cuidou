"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { JobStatus, ServiceType } from "@prisma/client";
import { Loader2, PlusCircle, Save } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JobScheduleEditor, JobScheduleSlotDraft } from "./job-schedule-editor";

type JobFormModel = {
  id?: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  state: string;
  city: string;
  neighborhood?: string | null;
  hourlyRateMin?: number | null;
  hourlyRateMax?: number | null;
  scheduleDetails?: string | null;
  scheduleSlots: JobScheduleSlotDraft[];
  status?: JobStatus;
};

type Props = {
  mode: "create" | "edit";
  initialValue?: JobFormModel;
  onSaved?: (job: unknown) => void;
};

const serviceTypeLabel: Record<ServiceType, string> = {
  BABYSITTER: "Babá",
  ELDER_CAREGIVER: "Cuidadora de idosos",
};

const defaultSlots: JobScheduleSlotDraft[] = [
  {
    weekday: "MONDAY",
    startTime: "08:00",
    endTime: "12:00",
  },
];

function getInitialValue(initialValue?: JobFormModel): JobFormModel {
  return {
    serviceType: initialValue?.serviceType ?? ServiceType.BABYSITTER,
    title: initialValue?.title ?? "",
    description: initialValue?.description ?? "",
    state: initialValue?.state ?? "",
    city: initialValue?.city ?? "",
    neighborhood: initialValue?.neighborhood ?? "",
    hourlyRateMin: initialValue?.hourlyRateMin ?? null,
    hourlyRateMax: initialValue?.hourlyRateMax ?? null,
    scheduleDetails: initialValue?.scheduleDetails ?? "",
    scheduleSlots:
      initialValue?.scheduleSlots.length && initialValue.scheduleSlots.length > 0
        ? initialValue.scheduleSlots
        : defaultSlots,
    status: initialValue?.status,
    id: initialValue?.id,
  };
}

export function JobForm({ mode, initialValue, onSaved }: Props) {
  const router = useRouter();
  const { error: showError, success, warning } = useToast();
  const [form, setForm] = useState<JobFormModel>(() => getInitialValue(initialValue));
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const hasScheduleErrors = useMemo(() => {
    if (form.scheduleSlots.length === 0) {
      return true;
    }

    const keys = new Set<string>();
    for (const slot of form.scheduleSlots) {
      if (!slot.startTime || !slot.endTime || slot.endTime <= slot.startTime) {
        return true;
      }

      const key = `${slot.weekday}:${slot.startTime}:${slot.endTime}`;
      if (keys.has(key)) {
        return true;
      }
      keys.add(key);
    }

    return false;
  }, [form.scheduleSlots]);

  const hasInvalidRateRange = useMemo(() => {
    if (form.hourlyRateMin == null || form.hourlyRateMax == null) {
      return false;
    }

    return form.hourlyRateMin > form.hourlyRateMax;
  }, [form.hourlyRateMax, form.hourlyRateMin]);

  function setField<K extends keyof JobFormModel>(field: K, value: JobFormModel[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasScheduleErrors) {
      const message = "Revise os horarios da agenda para continuar.";
      setValidationError(message);
      warning("Agenda invalida", message);
      return;
    }

    if (hasInvalidRateRange) {
      const message = "A faixa de valor esta invalida: o minimo nao pode ser maior que o maximo.";
      setValidationError(message);
      warning("Faixa de valor invalida", message);
      return;
    }

    setLoading(true);
    setValidationError(null);

    try {
      const payload = {
        serviceType: form.serviceType,
        title: form.title.trim(),
        description: form.description.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        neighborhood: form.neighborhood?.trim() || undefined,
        hourlyRateMin: form.hourlyRateMin ?? undefined,
        hourlyRateMax: form.hourlyRateMax ?? undefined,
        scheduleDetails: form.scheduleDetails?.trim() || undefined,
        scheduleSlots: form.scheduleSlots,
        ...(mode === "edit" && form.status ? { status: form.status } : {}),
      };

      const response = await fetch(mode === "create" ? "/api/jobs" : `/api/jobs/${form.id}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        showError("Não foi possível salvar a vaga.", result.error);
        return;
      }

      success(mode === "create" ? "Vaga criada com sucesso." : "Vaga atualizada com sucesso.");
      onSaved?.(result.job);
      router.refresh();

      if (mode === "create") {
        setForm(getInitialValue());
      }
    } catch {
      showError("Erro inesperado ao salvar vaga.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Tipo de serviço</span>
          <select
            className="theme-select"
            value={form.serviceType}
            onChange={(event) => setField("serviceType", event.target.value as ServiceType)}
            disabled={loading}
            required
          >
            {Object.entries(serviceTypeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Título</span>
          <input
            className="theme-field"
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            minLength={5}
            maxLength={160}
            required
            disabled={loading}
          />
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Descrição</span>
        <textarea
          className="theme-textarea"
          value={form.description}
          onChange={(event) => setField("description", event.target.value)}
          minLength={20}
          maxLength={4000}
          required
          disabled={loading}
        />
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Estado</span>
          <input
            className="theme-field"
            value={form.state}
            onChange={(event) => setField("state", event.target.value)}
            minLength={2}
            maxLength={120}
            required
            disabled={loading}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Cidade</span>
          <input
            className="theme-field"
            value={form.city}
            onChange={(event) => setField("city", event.target.value)}
            minLength={2}
            maxLength={120}
            required
            disabled={loading}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Bairro</span>
          <input
            className="theme-field"
            value={form.neighborhood ?? ""}
            onChange={(event) => setField("neighborhood", event.target.value)}
            maxLength={120}
            disabled={loading}
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Valor mínimo/hora (opcional)</span>
          <input
            type="number"
            className="theme-field"
            value={form.hourlyRateMin ?? ""}
            onChange={(event) =>
              setField("hourlyRateMin", event.target.value ? Number(event.target.value) : null)
            }
            min={1}
            disabled={loading}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Valor máximo/hora (opcional)</span>
          <input
            type="number"
            className="theme-field"
            value={form.hourlyRateMax ?? ""}
            onChange={(event) =>
              setField("hourlyRateMax", event.target.value ? Number(event.target.value) : null)
            }
            min={1}
            disabled={loading}
          />
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Observações de agenda (legado/opcional)</span>
        <textarea
          className="theme-textarea min-h-20"
          value={form.scheduleDetails ?? ""}
          onChange={(event) => setField("scheduleDetails", event.target.value)}
          maxLength={1000}
          disabled={loading}
          placeholder="Ex: preferência por rotina escolar, observações adicionais"
        />
      </label>

      <div className="rounded-2xl border border-[var(--theme-border)] bg-[rgba(255,255,255,0.92)] p-3">
        <h4 className="text-lg text-[var(--theme-navy)]">Agenda estruturada (obrigatória)</h4>
        <div className="mt-2">
          <JobScheduleEditor
            value={form.scheduleSlots}
            onChange={(slots) => setField("scheduleSlots", slots)}
            disabled={loading}
          />
        </div>
      </div>

      {mode === "edit" ? (
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Status da vaga</span>
          <select
            className="theme-select"
            value={form.status ?? JobStatus.OPEN}
            onChange={(event) => setField("status", event.target.value as JobStatus)}
            disabled={loading}
          >
            <option value={JobStatus.OPEN}>OPEN</option>
            <option value={JobStatus.PAUSED}>PAUSED</option>
            <option value={JobStatus.CLOSED}>CLOSED</option>
            <option value={JobStatus.ARCHIVED}>ARCHIVED</option>
          </select>
        </label>
      ) : null}

      {validationError ? <p className="theme-alert theme-alert-danger">{validationError}</p> : null}
      {hasInvalidRateRange ? (
        <p className="theme-alert theme-alert-warning">
          O valor minimo/hora deve ser menor ou igual ao valor maximo/hora.
        </p>
      ) : null}

      <ActionButton
        type="submit"
        icon={loading ? Loader2 : mode === "create" ? PlusCircle : Save}
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {loading ? "Salvando..." : mode === "create" ? "Criar vaga" : "Salvar vaga"}
      </ActionButton>
    </form>
  );
}

