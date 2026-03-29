"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { Save } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FamilyProfileInput = {
  contactName: string;
  phone?: string | null;
  bio?: string | null;
  state: string;
  city: string;
  neighborhood?: string | null;
};

type Props = {
  initialValue: FamilyProfileInput;
};

export function FamilyProfileForm({ initialValue }: Props) {
  const router = useRouter();
  const { error: showError, success } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FamilyProfileInput>({
    contactName: initialValue.contactName ?? "",
    phone: initialValue.phone ?? "",
    bio: initialValue.bio ?? "",
    state: initialValue.state ?? "",
    city: initialValue.city ?? "",
    neighborhood: initialValue.neighborhood ?? "",
  });

  function setField<K extends keyof FamilyProfileInput>(key: K, value: FamilyProfileInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/family/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactName: form.contactName.trim(),
          phone: form.phone?.trim() || undefined,
          bio: form.bio?.trim() || undefined,
          state: form.state.trim(),
          city: form.city.trim(),
          neighborhood: form.neighborhood?.trim() || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Falha ao salvar perfil da familia.", payload.error);
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
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">
            Nome de contato
          </span>
          <input
            className="theme-field"
            value={form.contactName}
            onChange={(event) => setField("contactName", event.target.value)}
            minLength={2}
            maxLength={120}
            required
            disabled={loading}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">
            Telefone
          </span>
          <input
            className="theme-field"
            value={form.phone ?? ""}
            onChange={(event) => setField("phone", event.target.value)}
            placeholder="(11) 99999-9999"
            maxLength={30}
            disabled={loading}
          />
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Bio</span>
        <textarea
          className="theme-textarea"
          value={form.bio ?? ""}
          onChange={(event) => setField("bio", event.target.value)}
          maxLength={1200}
          disabled={loading}
          placeholder="Descreva sua rotina, necessidades e expectativas."
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

      <ActionButton type="submit" icon={Save} disabled={loading} className="w-full sm:w-auto">
        {loading ? "Salvando..." : "Salvar perfil"}
      </ActionButton>
    </form>
  );
}
