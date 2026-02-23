"use client";

import { ContractStatus } from "@prisma/client";
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
    return "theme-chip-blue";
  }

  if (status === ContractStatus.COMPLETED) {
    return "theme-chip-yellow";
  }

  return "theme-chip-pink";
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
    <section className="theme-card rounded-[36px] px-6 py-8 sm:px-8">
      <p className="theme-chip theme-chip-blue w-fit">Contratos</p>
      <h2 className="mt-4 text-3xl font-display text-[var(--theme-navy)]">
        Gestão de contratos
      </h2>
      <p className="mt-2 text-sm text-[var(--theme-body)]">
        Gerencie contratos em andamento, concluídos e cancelados.
      </p>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ul className="mt-5 space-y-3">
        {contracts.length === 0 ? (
          <li className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
            Nenhum contrato criado ainda.
          </li>
        ) : (
          contracts.map((contract) => (
            <li key={contract.id} className="theme-list-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-xl font-display text-[var(--theme-navy)]">{contract.job.title}</h3>
                <span className={`theme-chip ${statusTone(contract.status)}`}>{contract.status}</span>
              </div>

              <p className="mt-2 text-sm text-[var(--theme-body)]">
                Profissional: {contract.professional.name ?? "-"}
              </p>

              {contract.status === ContractStatus.CANCELED && contract.cancelReason ? (
                <p className="mt-2 rounded-xl bg-[var(--theme-pink)]/25 px-3 py-2 text-xs text-[#983f5a]">
                  Motivo: {contract.cancelReason}
                </p>
              ) : null}

              {contract.status === ContractStatus.IN_PROGRESS ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === contract.id}
                    onClick={() => completeContract(contract.id)}
                    className="btn-primary disabled:opacity-60"
                  >
                    Concluir
                  </button>
                  <button
                    type="button"
                    disabled={busyId === contract.id}
                    onClick={() => cancelContract(contract.id)}
                    className="btn-secondary disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
