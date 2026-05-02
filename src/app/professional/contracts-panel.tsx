"use client";

import { ReviewForm } from "@/components/reviews/review-form";
import { StatusBadge } from "@/components/theme/status-badge";
import { ContractStatus } from "@/lib/prisma-enums";
import { useState } from "react";

type ContractItem = {
  id: string;
  applicationId: string;
  status: ContractStatus;
  startedAt: string;
  completedAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  hasReviewedByCurrentUser: boolean;
  job: {
    title: string;
  };
  family: {
    name: string | null;
  };
};

type Props = {
  initialContracts: ContractItem[];
};

function statusTone(status: ContractStatus) {
  if (status === ContractStatus.IN_PROGRESS) {
    return "info" as const;
  }
  if (status === ContractStatus.COMPLETED) {
    return "success" as const;
  }
  return "danger" as const;
}

export function ProfessionalContractsPanel({ initialContracts }: Props) {
  const [contracts, setContracts] = useState(initialContracts);

  return (
    <section id="contratos-profissional" className="theme-card rounded-[34px] px-6 py-8 sm:px-8">
      <p className="theme-chip theme-chip-blue w-fit">Contratos</p>
      <h2 className="mt-3 text-3xl">Meus contratos</h2>
      <p className="mt-2 text-sm text-[var(--theme-body)]">
        Acompanhe contratos em andamento e avalie familias ao concluir.
      </p>

      <div className="mt-4 space-y-3">
        {contracts.length === 0 ? (
          <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
            Nenhum contrato encontrado.
          </p>
        ) : (
          contracts.map((contract) => (
            <article key={contract.id} className="theme-list-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={statusTone(contract.status)}>{contract.status}</StatusBadge>
              </div>
              <h3 className="mt-2 text-xl text-[var(--theme-navy)]">{contract.job.title}</h3>
              <p className="mt-1 text-sm text-[var(--theme-body)]">
                Familia: {contract.family.name ?? "-"}
              </p>

              {contract.status === ContractStatus.CANCELED && contract.cancelReason ? (
                <p className="theme-alert theme-alert-warning mt-2">Motivo: {contract.cancelReason}</p>
              ) : null}

              {contract.status === ContractStatus.COMPLETED ? (
                <div className="mt-3">
                  <ReviewForm
                    applicationId={contract.applicationId}
                    targetLabel={contract.family.name ?? "familia"}
                    initiallyReviewed={contract.hasReviewedByCurrentUser}
                    onReviewed={() =>
                      setContracts((current) =>
                        current.map((item) =>
                          item.id === contract.id
                            ? { ...item, hasReviewedByCurrentUser: true }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
