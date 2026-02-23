"use client";

import { ActionButton } from "@/components/theme/action-button";
import { StatusBadge } from "@/components/theme/status-badge";
import { ContractStatus } from "@prisma/client";
import { CheckCircle2, CircleOff } from "lucide-react";
import { useState } from "react";

type ContractItem = {
  id: string;
  status: ContractStatus;
  createdAt: string;
  startedAt: string;
  completedAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  job: {
    title: string;
  };
  professional: {
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

export function FamilyContractsPanel({ initialContracts }: Props) {
  const [contracts, setContracts] = useState(initialContracts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function completeContract(contractId: string) {
    setBusyId(contractId);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/${contractId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Falha ao concluir contrato.");
        return;
      }

      setContracts((current) =>
        current.map((item) =>
          item.id === contractId
            ? {
                ...item,
                status: result.contract.status,
                completedAt: result.contract.completedAt,
              }
            : item,
        ),
      );
    } catch {
      setError("Erro inesperado ao concluir contrato.");
    } finally {
      setBusyId(null);
    }
  }

  async function cancelContract(contractId: string) {
    const reason = window.prompt("Motivo do cancelamento:");
    if (!reason || reason.trim().length < 5) {
      setError("Informe um motivo com pelo menos 5 caracteres.");
      return;
    }

    setBusyId(contractId);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/${contractId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reason.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Falha ao cancelar contrato.");
        return;
      }

      setContracts((current) =>
        current.map((item) =>
          item.id === contractId
            ? {
                ...item,
                status: result.contract.status,
                canceledAt: result.contract.canceledAt,
                cancelReason: result.contract.cancelReason,
              }
            : item,
        ),
      );
    } catch {
      setError("Erro inesperado ao cancelar contrato.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="theme-card rounded-[34px] px-6 py-8 sm:px-8">
      <p className="theme-chip theme-chip-blue w-fit">Contratos</p>
      <h2 className="mt-4 text-3xl">Gestão de contratos</h2>
      <p className="mt-2 text-sm text-[var(--theme-body)]">
        Gerencie contratos em andamento, concluídos e cancelados.
      </p>

      {error ? <p className="theme-alert theme-alert-danger mt-4">{error}</p> : null}

      <ul className="mt-5 space-y-3">
        {contracts.length === 0 ? (
          <li className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
            Nenhum contrato criado ainda.
          </li>
        ) : (
          contracts.map((contract) => (
            <li key={contract.id} className="theme-list-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-xl leading-tight">{contract.job.title}</h3>
                <StatusBadge tone={statusTone(contract.status)}>{contract.status}</StatusBadge>
              </div>

              <p className="mt-2 text-sm text-[var(--theme-body)]">
                Profissional: {contract.professional.name ?? "-"}
              </p>

              {contract.status === ContractStatus.CANCELED && contract.cancelReason ? (
                <p className="theme-alert theme-alert-warning mt-2">Motivo: {contract.cancelReason}</p>
              ) : null}

              {contract.status === ContractStatus.IN_PROGRESS ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton
                    type="button"
                    size="sm"
                    icon={CheckCircle2}
                    disabled={busyId === contract.id}
                    onClick={() => completeContract(contract.id)}
                    className="disabled:opacity-60"
                  >
                    Concluir
                  </ActionButton>
                  <ActionButton
                    type="button"
                    size="sm"
                    icon={CircleOff}
                    variant="secondary"
                    disabled={busyId === contract.id}
                    onClick={() => cancelContract(contract.id)}
                    className="disabled:opacity-60"
                  >
                    Cancelar
                  </ActionButton>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
