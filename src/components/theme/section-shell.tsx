import type { ReactNode } from "react";
import { BlobDecor } from "@/components/theme/blob-decor";

type SectionTone = "light" | "deep" | "tint";

type SectionShellProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: SectionTone;
  className?: string;
  children: ReactNode;
};

const toneClassMap: Record<SectionTone, string> = {
  light: "bg-white/90 border-[var(--theme-border)] text-[var(--theme-body)]",
  deep: "bg-[var(--theme-indigo)] text-white border-[var(--theme-indigo-strong)]",
  tint: "bg-[var(--theme-cream)] border-[var(--theme-border)] text-[var(--theme-body)]",
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  tone = "light",
  className,
  children,
}: SectionShellProps) {
  const isDeep = tone === "deep";

  return (
    <section
      id={id}
      className={joinClasses(
        "relative overflow-hidden rounded-[36px] border px-6 py-8 shadow-[0_30px_70px_-46px_rgba(24,40,116,0.75)] sm:px-8 sm:py-10",
        toneClassMap[tone],
        className,
      )}
    >
      <BlobDecor tone={isDeep ? "blue" : "yellow"} className="-right-10 top-8 h-28 w-28 opacity-30" />
      <BlobDecor tone={isDeep ? "pink" : "blue"} className="-left-10 bottom-2 h-24 w-24 opacity-25" />

      <div className="relative">
        {eyebrow ? (
          <p
            className={joinClasses(
              "inline-flex rounded-full px-3 py-1 text-xs font-display uppercase tracking-[0.08em]",
              isDeep
                ? "bg-white/15 text-white/90"
                : "border border-[var(--theme-border)] bg-white/70 text-[var(--theme-indigo)]",
            )}
          >
            {eyebrow}
          </p>
        ) : null}

        {title ? (
          <h2
            className={joinClasses(
              "mt-4 text-3xl font-display leading-tight sm:text-[2.05rem]",
              isDeep ? "text-white" : "text-[var(--theme-navy)]",
            )}
          >
            {title}
          </h2>
        ) : null}

        {description ? (
          <p
            className={joinClasses(
              "mt-3 max-w-3xl text-base leading-relaxed",
              isDeep ? "text-white/88" : "text-[var(--theme-body)]",
            )}
          >
            {description}
          </p>
        ) : null}

        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}
