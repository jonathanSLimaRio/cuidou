import { StatusBadge } from "@/components/theme/status-badge";
import type { ReactNode } from "react";

type OpportunityStateCardProps = {
  title: string;
  subtitle?: string;
  statusLabel: string;
  statusTone: Parameters<typeof StatusBadge>[0]["tone"];
  stateLabel?: string;
  details?: ReactNode;
  actions?: ReactNode;
};

export function OpportunityStateCard({
  title,
  subtitle,
  statusLabel,
  statusTone,
  stateLabel,
  details,
  actions,
}: OpportunityStateCardProps) {
  return (
    <article className="rounded-2xl border border-[var(--theme-border)] bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-lg leading-tight text-[var(--theme-navy)]">{title}</h4>
          {subtitle ? <p className="mt-1 text-xs text-[var(--theme-muted)]">{subtitle}</p> : null}
        </div>
        <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
      </div>

      {stateLabel ? <p className="mt-2 text-xs text-[var(--theme-muted)]">{stateLabel}</p> : null}
      {details ? <div className="mt-2 text-sm text-[var(--theme-body)]">{details}</div> : null}
      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
    </article>
  );
}
