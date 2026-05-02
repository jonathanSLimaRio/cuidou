"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { StatusBadge } from "@/components/theme/status-badge";
import { DocumentType, VerificationStatus } from "@/lib/prisma-enums";
import { Upload } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DocumentItem = {
  id: string;
  documentType: DocumentType;
  fileUrl: string;
  status: VerificationStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

type Props = {
  initialVerificationStatus: VerificationStatus;
  initialDocuments: DocumentItem[];
};

const documentLabels: Record<DocumentType, string> = {
  IDENTITY: "Documento de identidade",
  BACKGROUND_CHECK: "Antecedentes",
  CERTIFICATION: "Certificacao",
  OTHER: "Outro",
};

function verificationTone(status: VerificationStatus) {
  if (status === VerificationStatus.VERIFIED) {
    return "success" as const;
  }
  if (status === VerificationStatus.REJECTED) {
    return "danger" as const;
  }
  if (status === VerificationStatus.UNDER_REVIEW) {
    return "warning" as const;
  }
  return "neutral" as const;
}

export function DocumentsPanel({ initialDocuments, initialVerificationStatus }: Props) {
  const router = useRouter();
  const { error: showError, success } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [verificationStatus, setVerificationStatus] = useState(initialVerificationStatus);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.IDENTITY);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const sortedDocuments = useMemo(
    () =>
      [...documents].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [documents],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      showError("Selecione um arquivo para enviar.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("file", file);

      const response = await fetch("/api/professional/documents", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        showError("Falha ao enviar documento.", payload.error);
        return;
      }

      const created: DocumentItem = {
        ...payload.document,
        reviewedAt: payload.document.reviewedAt ?? null,
      };
      setDocuments((current) => [created, ...current]);
      setVerificationStatus(VerificationStatus.UNDER_REVIEW);
      setFile(null);
      success("Documento enviado com sucesso.");
      router.refresh();
    } catch {
      showError("Erro inesperado ao enviar documento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="documentos-verificacao" className="theme-card rounded-[34px] px-6 py-8 sm:px-8">
      <p className="theme-chip theme-chip-indigo w-fit">Documentacao</p>
      <h2 className="mt-3 text-3xl">Verificacao documental</h2>
      <p className="mt-2 text-sm text-[var(--theme-body)]">
        Envie documentos para analise da equipe de moderacao.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge tone={verificationTone(verificationStatus)}>
          Status do perfil: {verificationStatus}
        </StatusBadge>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-2xl border border-[var(--theme-border)] bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr] sm:items-end">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">
              Tipo do documento
            </span>
            <select
              className="theme-select"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as DocumentType)}
              disabled={loading}
            >
              {(Object.keys(documentLabels) as DocumentType[]).map((item) => (
                <option key={item} value={item}>
                  {documentLabels[item]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">
              Arquivo
            </span>
            <input
              type="file"
              className="w-full rounded-xl border border-[var(--theme-border)] bg-white px-3 py-2 text-sm"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              accept="image/*,application/pdf"
              disabled={loading}
            />
          </label>
        </div>

        <ActionButton type="submit" icon={Upload} disabled={loading} className="w-full sm:w-auto">
          {loading ? "Enviando..." : "Enviar documento"}
        </ActionButton>
      </form>

      <div className="mt-5 space-y-3">
        {sortedDocuments.length === 0 ? (
          <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
            Nenhum documento enviado ate o momento.
          </p>
        ) : (
          sortedDocuments.map((document) => (
            <article key={document.id} className="theme-list-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={verificationTone(document.status)}>{document.status}</StatusBadge>
                <StatusBadge tone="neutral">{documentLabels[document.documentType]}</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-[var(--theme-body)]">
                Enviado em {new Date(document.createdAt).toLocaleString("pt-BR")}
              </p>
              {document.reviewedAt ? (
                <p className="mt-1 text-xs text-[var(--theme-muted)]">
                  Revisado em {new Date(document.reviewedAt).toLocaleString("pt-BR")}
                </p>
              ) : null}
              {document.rejectionReason ? (
                <p className="theme-alert theme-alert-warning mt-2">Motivo: {document.rejectionReason}</p>
              ) : null}
              <a
                href={document.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-[var(--theme-indigo)] underline underline-offset-2"
              >
                Abrir arquivo
              </a>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
