"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { Save } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ServiceType = "BABYSITTER" | "ELDER_CAREGIVER";

type ProfessionalProfileInput = {
  bio?: string | null;
  experienceYears?: number | null;
  serviceTypes: ServiceType[];
  availability?: string | null;
  state: string;
  city: string;
  neighborhood?: string | null;
  hourlyRateMin?: number | null;
  hourlyRateMax?: number | null;
  phone?: string | null;
};

type Props = {
  initialValue: ProfessionalProfileInput;
};

const serviceLabels: Record<ServiceType, string> = {
  BABYSITTER: "Baba",
  ELDER_CAREGIVER: "Cuidadora de idosos",
};

export function ProfessionalProfileForm({ initialValue }: Props) {
  const router = useRouter();
  const { error: showError, success, warning } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProfessionalProfileInput>({
    bio: initialValue.bio ?? "",
    experienceYears: initialValue.experienceYears ?? null,
    serviceTypes: initialValue.serviceTypes ?? [],
    availability: initialValue.availability ?? "",
    state: initialValue.state ?? "",
    city: initialValue.city ?? "",
    neighborhood: initialValue.neighborhood ?? "",
    hourlyRateMin: initialValue.hourlyRateMin ?? null,
    hourlyRateMax: initialValue.hourlyRateMax ?? null,
    phone: initialValue.phone ?? "",
  });

  const hasInvalidRateRange = useMemo(() => {
    if (form.hourlyRateMin == null || form.hourlyRateMax == null) {
      return false;
    }
    return form.hourlyRateMin > form.hourlyRateMax;
  }, [form.hourlyRateMax, form.hourlyRateMin]);

  function toggleServiceType(serviceType: ServiceType) {
    setForm((current) => {
      const exists = current.serviceTypes.includes(serviceType);
      return {
        ...current,
        serviceTypes: exists
          ? current.serviceTypes.filter((item) => item !== serviceType)
          : [...current.serviceTypes, serviceType],
      };
    });
  }

  function setField<K extends keyof ProfessionalProfileInput>(
    key: K,
    value: ProfessionalProfileInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.serviceTypes.length === 0) {
      warning("Especialidade obrigatoria", "Selecione ao menos um tipo de servico.");
      return;
    }

    if (hasInvalidRateRange) {
      warning("Faixa de valor invalida", "O valor minimo nao pode ser maior que o maximo.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/professional/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: form.bio?.trim() || undefined,
          experienceYears: form.experienceYears ?? undefined,
          serviceTypes: form.serviceTypes,
          availability: form.availability?.trim() || undefined,
          state: form.state.trim(),
          city: form.city.trim(),
          neighborhood: form.neighborhood?.trim() || undefined,
          hourlyRateMin: form.hourlyRateMin ?? undefined,
          hourlyRateMax: form.hourlyRateMax ?? undefined,
          phone: form.phone?.trim() || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Falha ao salvar perfil profissional.", payload.error);
        return;
      }

      success("Perfil atualizado com sucesso.");
      router.refresh();
    } catch {
      showError("Erro inesperado ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Bio</span>
        <textarea
          className="theme-textarea"
          value={form.bio ?? ""}
          onChange={(event) => setField("bio", event.target.value)}
          maxLength={2000}
          disabled={loading}
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">
            Anos de experiencia
          </span>
          <input
            type="number"
            className="theme-field"
            value={form.experienceYears ?? ""}
            onChange={(event) =>
              setField("experienceYears", event.target.value ? Number(event.target.value) : null)
            }
            min={0}
            max={70}
            disabled={loading}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Telefone</span>
          <input
            className="theme-field"
            value={form.phone ?? ""}
            onChange={(event) => setField("phone", event.target.value)}
            maxLength={30}
            placeholder="(11) 99999-9999"
            disabled={loading}
          />
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Especialidades</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(serviceLabels) as ServiceType[]).map((serviceType) => (
            <label
              key={serviceType}
              className="flex items-center gap-2 rounded-xl border border-[var(--theme-border)] bg-white px-3 py-2 text-sm text-[var(--theme-body)]"
            >
              <input
                type="checkbox"
                checked={form.serviceTypes.includes(serviceType)}
                onChange={() => toggleServiceType(serviceType)}
                disabled={loading}
              />
              {serviceLabels[serviceType]}
            </label>
          ))}
        </div>
      </div>

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
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Valor minimo/hora</span>
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
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Valor maximo/hora</span>
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

      {hasInvalidRateRange ? (
        <p className="theme-alert theme-alert-warning">
          O valor minimo nao pode ser maior que o valor maximo.
        </p>
      ) : null}

      <ActionButton type="submit" icon={Save} disabled={loading} className="w-full sm:w-auto">
        {loading ? "Salvando..." : "Salvar perfil"}
      </ActionButton>
    </form>
  );
}
