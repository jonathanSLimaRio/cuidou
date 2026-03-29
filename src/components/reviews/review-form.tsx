"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { Star } from "lucide-react";
import { FormEvent, useState } from "react";

type Props = {
  applicationId: string;
  targetLabel: string;
  initiallyReviewed?: boolean;
  onReviewed?: () => void;
};

export function ReviewForm({
  applicationId,
  targetLabel,
  initiallyReviewed = false,
  onReviewed,
}: Props) {
  const { error: showError, success, warning } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewed, setReviewed] = useState(initiallyReviewed);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (reviewed) {
      warning("Avaliacao ja enviada.");
      return;
    }

    if (rating < 1 || rating > 5) {
      warning("Nota invalida", "A nota deve estar entre 1 e 5.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Falha ao enviar avaliacao.", payload.error);
        return;
      }

      setReviewed(true);
      setComment("");
      success(`Avaliacao enviada para ${targetLabel}.`);
      onReviewed?.();
    } catch {
      showError("Erro inesperado ao enviar avaliacao.");
    } finally {
      setLoading(false);
    }
  }

  if (reviewed) {
    return (
      <p className="theme-alert theme-alert-success">Avaliacao enviada para {targetLabel}.</p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-2xl border border-[var(--theme-border)] bg-white p-3">
      <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Avaliacao pos-contrato</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-[var(--theme-body)]">Nota</label>
        <select
          className="theme-select max-w-28"
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          disabled={loading}
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <Star size={16} className="text-[var(--theme-indigo)]" />
      </div>
      <textarea
        className="theme-textarea min-h-20"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={1000}
        placeholder="Comentario opcional"
        disabled={loading}
      />
      <ActionButton type="submit" size="sm" icon={Star} disabled={loading}>
        {loading ? "Enviando..." : "Enviar avaliacao"}
      </ActionButton>
    </form>
  );
}
