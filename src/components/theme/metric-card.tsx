import type { ReactNode } from "react";

type MetricTone = "pink" | "blue" | "yellow" | "indigo" | "white";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: MetricTone;
  className?: string;
};

const toneClassMap: Record<MetricTone, string> = {
  pink: "bg-[var(--theme-pink)]/65 border-[var(--theme-pink-strong)]/35",
  blue: "bg-[var(--theme-sky)]/65 border-[var(--theme-sky-strong)]/35",
  yellow: "bg-[var(--theme-yellow)]/70 border-[#f7c35a]/35",
  indigo: "bg-[var(--theme-indigo)] text-white border-[var(--theme-indigo-strong)]",
  white: "bg-white/95 border-[var(--theme-border)]",
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "white",
  className,
}: MetricCardProps) {
  return (
    <article
      className={joinClasses(
        "rounded-3xl border p-5 shadow-[0_20px_45px_-36px_rgba(25,37,107,0.85)] animate-fade-up",
        toneClassMap[tone],
        className,
      )}
    >
      <p className={joinClasses("text-sm", tone === "indigo" ? "text-white/80" : "text-[var(--theme-muted)]")}>
        {label}
      </p>
      <p className={joinClasses("mt-3 text-3xl font-display leading-none", tone === "indigo" ? "text-white" : "text-[var(--theme-navy)]")}>
        {value}
      </p>
      {hint ? (
        <p className={joinClasses("mt-3 text-sm leading-relaxed", tone === "indigo" ? "text-white/85" : "text-[var(--theme-body)]")}>
          {hint}
        </p>
      ) : null}
    </article>
  );
}
