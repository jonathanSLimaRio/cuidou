import Link from "next/link";
import type { ReactNode } from "react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AppShellProps = {
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  children: ReactNode;
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AppShell({ breadcrumbs, className, children }: AppShellProps) {
  return (
    <main className="theme-page">
      <div className="theme-container">
        <div className={joinClasses("theme-stack", className)}>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-[var(--theme-muted)]">
              {breadcrumbs.map((item, index) => (
                <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
                  {item.href ? (
                    <Link href={item.href} className="rounded-full px-2 py-1 hover:bg-white hover:text-[var(--theme-indigo)]">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="rounded-full bg-white/65 px-2 py-1 text-[var(--theme-indigo)]">
                      {item.label}
                    </span>
                  )}
                  {index < breadcrumbs.length - 1 ? <span aria-hidden>›</span> : null}
                </span>
              ))}
            </nav>
          ) : null}

          {children}
        </div>
      </div>
    </main>
  );
}
