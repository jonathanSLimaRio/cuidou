import Link from "next/link";
import type { ReactNode } from "react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-8">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-[var(--theme-muted)]">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {item.href ? (
                <Link href={item.href} className="rounded-full px-2 py-1 hover:bg-[var(--theme-cream)] hover:text-[var(--theme-indigo)]">
                  {item.label}
                </Link>
              ) : (
                <span className="rounded-full bg-[var(--theme-cream)] px-2 py-1 text-[var(--theme-indigo)]">
                  {item.label}
                </span>
              )}
              {index < breadcrumbs.length - 1 ? <span aria-hidden>›</span> : null}
            </span>
          ))}
        </nav>
      ) : null}

      {eyebrow ? <p className="theme-chip theme-chip-blue">{eyebrow}</p> : null}
      <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">{title}</h1>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--theme-body)] sm:text-base">
          {description}
        </p>
      ) : null}

      {actions ? <div className="mt-5 flex flex-wrap gap-2.5">{actions}</div> : null}
    </section>
  );
}
