"use client";

import { AppIcon } from "@/components/theme/app-icon";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  linkClassName?: string;
  /** Show the label text next to the icon */
  showLabel?: boolean;
};

export function NotificationBell({ linkClassName, showLabel = true }: Props) {
  const [unreadCount, setUnreadCount] = useState(0);

  async function fetchUnread() {
    try {
      const res = await fetch("/api/notifications?unreadOnly=true&pageSize=1&page=1", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { total?: number };
      setUnreadCount(data.total ?? 0);
    } catch {
      // silent — badge just won't update
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUnread();
    const interval = setInterval(() => void fetchUnread(), 30_000);

    function onFocus() {
      void fetchUnread();
    }
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <Link href="/notifications" className={linkClassName}>
      <span className="relative inline-flex">
        <AppIcon icon={Bell} size="sm" />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </span>
      {showLabel && "Notificacoes"}
    </Link>
  );
}
