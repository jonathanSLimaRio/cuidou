"use client";

import { AppIcon } from "@/components/theme/app-icon";
import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
};

export function ModalShell({ open, onClose, title, description, children }: ModalShellProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="theme-modal-root" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="theme-modal-backdrop" aria-label="Fechar modal" onClick={onClose} />
      <section className="theme-modal-panel">
        <header className="theme-modal-header">
          <div>
            <h2 id={titleId} className="text-3xl leading-tight">
              {title}
            </h2>
            {description ? <p className="mt-2 text-sm text-[var(--theme-body)]">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="theme-modal-close"
          >
            <AppIcon icon={X} size="md" />
          </button>
        </header>
        <div className="theme-modal-content">{children}</div>
      </section>
    </div>
  );
}
