import type { ReactNode } from "react";
import { BlobDecor } from "@/components/theme/blob-decor";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  sideContent?: ReactNode;
  className?: string;
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  sideContent,
  className,
}: PageHeroProps) {
  return (
    <section
      className={joinClasses(
        "relative overflow-hidden rounded-[36px] border border-[var(--theme-border)] bg-white/90 px-6 py-9 shadow-[0_30px_70px_-44px_rgba(23,39,118,0.7)] sm:px-8 lg:px-10",
        className,
      )}
    >
      <BlobDecor tone="pink" className="-right-12 top-8 h-36 w-36 opacity-45" />
      <BlobDecor tone="blue" className="-left-12 bottom-0 h-32 w-32 opacity-45" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          {eyebrow ? (
            <p className="inline-flex rounded-full border border-[var(--theme-border)] bg-[var(--theme-yellow)]/45 px-3 py-1 text-xs font-display uppercase tracking-[0.08em] text-[var(--theme-indigo)]">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-4 text-3xl font-display leading-tight text-[var(--theme-navy)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--theme-body)]">
            {description}
          </p>

          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        {sideContent ? <div className="relative">{sideContent}</div> : null}
      </div>
    </section>
  );
}
