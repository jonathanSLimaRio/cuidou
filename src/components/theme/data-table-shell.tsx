import type { ReactNode } from "react";

type DataTableShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DataTableShell({ title, description, actions, children }: DataTableShellProps) {
  return (
    <section className="theme-card rounded-[32px] px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-[var(--theme-body)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}
