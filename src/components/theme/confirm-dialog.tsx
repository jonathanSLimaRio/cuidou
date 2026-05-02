"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** If provided, shows a textarea and passes its value to onConfirm */
  inputLabel?: string;
  inputPlaceholder?: string;
  inputMinLength?: number;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  inputLabel,
  inputPlaceholder,
  inputMinLength = 0,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue("");
      const t = setTimeout(() => textareaRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  const confirmDisabled =
    busy || (inputLabel !== undefined && inputValue.trim().length < inputMinLength);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white px-6 py-6 shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="absolute right-4 top-4 rounded-full p-1 text-[var(--theme-muted)] hover:bg-[var(--theme-bg-soft)] disabled:opacity-40"
        >
          <X size={18} />
        </button>

        <h3 className="pr-8 text-2xl text-[var(--theme-navy)]">{title}</h3>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--theme-body)]">{description}</p>
        )}

        {inputLabel !== undefined && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--theme-navy)]">{inputLabel}</label>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              rows={3}
              disabled={busy}
              className="mt-1.5 w-full resize-none rounded-xl border border-[var(--theme-border)] bg-white px-3 py-2.5 text-sm text-[var(--theme-navy)] focus:border-[var(--brand-purple-primary)] focus:outline-none disabled:opacity-60"
            />
            {inputMinLength > 0 && (
              <p className="mt-1 text-xs text-[var(--theme-muted)]">
                Mínimo {inputMinLength} caracteres ({inputValue.trim().length}/{inputMinLength})
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-full border border-[var(--theme-border)] px-4 py-2 text-sm font-medium text-[var(--theme-navy)] hover:bg-[var(--theme-bg-soft)] disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={() => onConfirm(inputLabel !== undefined ? inputValue.trim() : undefined)}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-40",
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[var(--brand-purple-primary)] hover:bg-[var(--brand-purple-secondary)]",
            ].join(" ")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
