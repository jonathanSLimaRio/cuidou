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
    <section className="mt-6 rounded-xl border border-black/10 bg-white p-5">
      <h2 className="text-lg font-medium text-zinc-900">Contratos</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Gerencie contratos em andamento, concluídos e cancelados.
      </p>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <ul className="mt-4 space-y-3">
        {contracts.length === 0 ? (
          <li className="text-sm text-zinc-600">Nenhum contrato criado ainda.</li>
        ) : (
          contracts.map((contract) => (
            <li key={contract.id} className="rounded-lg border border-black/10 p-4">
              <p className="font-medium text-zinc-900">{contract.job.title}</p>
              <p className="text-sm text-zinc-600">
                Profissional: {contract.professional.name ?? "-"}
              </p>
              <p className="text-sm text-zinc-600">Status: {contract.status}</p>

              {contract.status === ContractStatus.CANCELED && contract.cancelReason ? (
                <p className="mt-1 text-xs text-zinc-500">Motivo: {contract.cancelReason}</p>
              ) : null}

              {contract.status === ContractStatus.IN_PROGRESS ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === contract.id}
                    onClick={() => completeContract(contract.id)}
                    className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    Concluir
                  </button>
                  <button
                    type="button"
                    disabled={busyId === contract.id}
                    onClick={() => cancelContract(contract.id)}
                    className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60"
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
