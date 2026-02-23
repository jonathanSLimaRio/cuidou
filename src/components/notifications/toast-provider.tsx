"use client";

import {
  mapNotificationToToast,
  type NotificationFeedItem,
} from "@/lib/notification-toast-map";
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ToastViewport } from "./toast-viewport";

const DEFAULT_AUTO_CLOSE_MS = 5000;
const MAX_VISIBLE_TOASTS = 3;
const NOTIFICATION_POLL_INTERVAL_MS = 15000;

export type ToastTone = "success" | "error" | "warning" | "info" | "neutral";

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  createdAt: number;
  autoCloseMs: number;
};

type ToastInput = {
  id?: string;
  tone: ToastTone;
  title: string;
  description?: string;
  autoCloseMs?: number;
};

export type ToastContextValue = {
  toasts: ToastItem[];
  toast: (input: ToastInput) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

type NotificationListPayload = {
  items?: NotificationFeedItem[];
};

function createToastId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const bootstrapDoneRef = useRef(false);
  const notificationsPollingStoppedRef = useRef(false);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));

    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const scheduleAutoDismiss = useCallback(
    (id: string, autoCloseMs: number) => {
      if (autoCloseMs <= 0) {
        return;
      }

      const existingTimer = timersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        dismiss(id);
      }, autoCloseMs);

      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const toast = useCallback(
    (input: ToastInput) => {
      const id = input.id ?? createToastId();
      const nextToast: ToastItem = {
        id,
        tone: input.tone,
        title: input.title,
        description: input.description,
        createdAt: Date.now(),
        autoCloseMs: input.autoCloseMs ?? DEFAULT_AUTO_CLOSE_MS,
      };

      setToasts((current) => {
        const next = [...current, nextToast];

        while (next.length > MAX_VISIBLE_TOASTS) {
          const removed = next.shift();
          if (removed) {
            const removedTimer = timersRef.current.get(removed.id);
            if (removedTimer) {
              clearTimeout(removedTimer);
              timersRef.current.delete(removed.id);
            }
          }
        }

        return next;
      });

      scheduleAutoDismiss(id, nextToast.autoCloseMs);
      return id;
    },
    [scheduleAutoDismiss],
  );

  const success = useCallback(
    (title: string, description?: string) => toast({ tone: "success", title, description }),
    [toast],
  );

  const error = useCallback(
    (title: string, description?: string) => toast({ tone: "error", title, description }),
    [toast],
  );

  const warning = useCallback(
    (title: string, description?: string) => toast({ tone: "warning", title, description }),
    [toast],
  );

  const info = useCallback(
    (title: string, description?: string) => toast({ tone: "info", title, description }),
    [toast],
  );

  useEffect(() => {
    let cancelled = false;

    async function pollNotifications() {
      if (cancelled || notificationsPollingStoppedRef.current) {
        return;
      }

      try {
        const response = await fetch("/api/notifications?unreadOnly=true&page=1&pageSize=20", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401) {
          notificationsPollingStoppedRef.current = true;
          return;
        }

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as NotificationListPayload;
        const items = Array.isArray(payload.items) ? payload.items : [];

        if (!bootstrapDoneRef.current) {
          for (const item of items) {
            if (item?.id) {
              seenNotificationIdsRef.current.add(item.id);
            }
          }
          bootstrapDoneRef.current = true;
          return;
        }

        const newItems = items.filter((item) => item?.id && !seenNotificationIdsRef.current.has(item.id));

        if (newItems.length === 0) {
          return;
        }

        for (const item of newItems) {
          seenNotificationIdsRef.current.add(item.id);
        }

        for (const item of [...newItems].reverse()) {
          const mapped = mapNotificationToToast(item);
          toast({
            id: mapped.id,
            tone: mapped.tone,
            title: mapped.title,
            description: mapped.description,
          });
        }
      } catch {
        // Silent fail. Local action toasts continue working.
      }
    }

    void pollNotifications();

    const interval = setInterval(() => {
      void pollNotifications();
    }, NOTIFICATION_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [toast]);

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      toasts,
      toast,
      success,
      error,
      warning,
      info,
      dismiss,
    }),
    [dismiss, error, info, success, toast, toasts, warning],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
