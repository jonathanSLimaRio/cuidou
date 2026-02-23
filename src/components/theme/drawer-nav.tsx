import { AppIcon } from "@/components/theme/app-icon";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";

type DrawerNavProps = {
  title?: string;
  children: ReactNode;
};

export function DrawerNav({ title = "Menu", children }: DrawerNavProps) {
  return (
    <details className="theme-drawer md:hidden">
      <summary className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[var(--theme-border)] bg-white text-lg text-[var(--theme-navy)] shadow-[var(--theme-shadow-sm)]">
        <AppIcon icon={Menu} size="lg" />
      </summary>
      <summary className="theme-drawer-backdrop" aria-label="Fechar menu" />
      <aside className="theme-drawer-panel">
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-4">
          <p className="font-display text-lg text-[var(--theme-navy)]">{title}</p>
          <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border border-[var(--theme-border)] text-sm text-[var(--theme-navy)]">
            <AppIcon icon={X} size="sm" />
          </span>
        </div>
        <div className="space-y-2 px-4 py-4">{children}</div>
      </aside>
    </details>
  );
}
