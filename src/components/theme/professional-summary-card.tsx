import { ActionButton } from "@/components/theme/action-button";
import { StatusBadge } from "@/components/theme/status-badge";
import { UserRoundSearch } from "lucide-react";
import type { ReactNode } from "react";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "pink" | "blue" | "yellow" | "indigo";

type ProfessionalSummaryCardProps = {
  professional: {
    name: string | null;
    email: string | null;
    image: string | null;
    profileId: string | null;
    city: string | null;
    state: string | null;
    verificationStatus: "NOT_SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | null;
    serviceTypes: Array<"BABYSITTER" | "ELDER_CAREGIVER">;
    experienceYears: number | null;
  };
  applicationStatusLabel: string;
  applicationStatusTone: StatusTone;
  stateLabel?: string;
  coverMessage?: string | null;
  sourceLabel?: string;
  actions?: ReactNode;
};

function serviceTypeLabel(value: "BABYSITTER" | "ELDER_CAREGIVER") {
  return value === "BABYSITTER" ? "Babá" : "Cuidadora de idosos";
}

function verificationLabel(
  value: "NOT_SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | null,
) {
  if (!value) {
    return null;
  }
  if (value === "VERIFIED") {
    return { tone: "success" as const, label: "Verificado" };
  }
  if (value === "REJECTED") {
    return { tone: "danger" as const, label: "Verificação rejeitada" };
  }
  if (value === "UNDER_REVIEW") {
    return { tone: "warning" as const, label: "Em análise" };
  }
  return { tone: "neutral" as const, label: "Não enviado" };
}

export function ProfessionalSummaryCard({
  professional,
  applicationStatusLabel,
  applicationStatusTone,
  stateLabel,
  coverMessage,
  sourceLabel,
  actions,
}: ProfessionalSummaryCardProps) {
  const displayName = professional.name ?? professional.email ?? "Profissional";
  const verification = verificationLabel(professional.verificationStatus);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "P";

  return (
    <article className="rounded-2xl border border-[var(--theme-border)] bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[var(--theme-border)] bg-[var(--theme-cream)]">
            {professional.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={professional.image}
                alt={`Foto de ${displayName}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="inline-flex h-full w-full items-center justify-center font-display text-sm text-[var(--theme-navy)]">
                {initials}
              </span>
            )}
          </span>
          <div>
            <h4 className="text-lg leading-tight text-[var(--theme-navy)]">{displayName}</h4>
            <p className="mt-1 text-xs text-[var(--theme-muted)]">{professional.email ?? "Sem email informado"}</p>
          </div>
        </div>
        <StatusBadge tone={applicationStatusTone}>{applicationStatusLabel}</StatusBadge>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {professional.city || professional.state ? (
          <StatusBadge tone="blue">
            {professional.city ?? "-"} / {professional.state ?? "-"}
          </StatusBadge>
        ) : null}
        {verification ? <StatusBadge tone={verification.tone}>{verification.label}</StatusBadge> : null}
        {professional.experienceYears !== null ? (
          <StatusBadge tone="neutral">{professional.experienceYears} ano(s) de experiência</StatusBadge>
        ) : null}
      </div>

      {professional.serviceTypes.length > 0 ? (
        <p className="mt-2 text-xs text-[var(--theme-muted)]">
          Especialidades: {professional.serviceTypes.map((item) => serviceTypeLabel(item)).join(", ")}
        </p>
      ) : null}

      {sourceLabel ? <p className="mt-2 text-xs text-[var(--theme-muted)]">{sourceLabel}</p> : null}
      {stateLabel ? <p className="mt-1 text-xs text-[var(--theme-muted)]">{stateLabel}</p> : null}

      <div className="mt-2 text-sm text-[var(--theme-body)]">
        {coverMessage ? `Mensagem: ${coverMessage}` : "Sem mensagem inicial."}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {actions}
        {professional.profileId ? (
          <ActionButton href={`/marketplace/professionals/${professional.profileId}`} size="sm" variant="secondary" icon={UserRoundSearch}>
            Ver perfil
          </ActionButton>
        ) : null}
      </div>
    </article>
  );
}
