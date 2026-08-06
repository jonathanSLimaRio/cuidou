"use client";

import { AppIcon } from "@/components/theme/app-icon";
import type { ToastItem, ToastTone } from "@/components/notifications/toast-provider";
import { CheckCircle2, CircleAlert, Info, X, XCircle } from "lucide-react";

type ToastViewportProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

function toneClass(tone: ToastTone) {
  if (tone === "success") {
    return "theme-toast-success";
  }

  if (tone === "error") {
    return "theme-toast-error";
  }

  if (tone === "warning") {
    return "theme-toast-warning";
  }

  if (tone === "info") {
    return "theme-toast-info";
  }

  return "theme-toast-neutral";
}

function toneIcon(tone: ToastTone) {
  if (tone === "success") {
    return CheckCircle2;
  }

  if (tone === "error") {
    return XCircle;
  }

  if (tone === "warning") {
    return CircleAlert;
  }

  return Info;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div className="theme-toast-viewport" role="status" aria-live="polite" aria-label="Notificações">
      {toasts.map((toast) => {
        const Icon = toneIcon(toast.tone);

        return (
          <article
            key={toast.id}
            className={`theme-toast ${toneClass(toast.tone)}`}
            role={toast.tone === "error" ? "alert" : "status"}
          >
            <div className="theme-toast-head">
              <span className="theme-toast-icon" aria-hidden>
                <AppIcon icon={Icon} size="sm" />
              </span>
              <p className="theme-toast-title">{toast.title}</p>
              <button
                type="button"
                className="theme-toast-close"
                aria-label="Fechar notificação"
                onClick={() => onDismiss(toast.id)}
              >
                <AppIcon icon={X} size="sm" />
              </button>
            </div>
            {toast.description ? <p className="theme-toast-description">{toast.description}</p> : null}
          </article>
        );
      })}
    </div>
  );
}
