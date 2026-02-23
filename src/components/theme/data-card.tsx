import type { ReactNode } from "react";
import Link from "next/link";

type DataCardTone = "surface" | "tint" | "deep";

type DataCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: DataCardTone;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

const toneMap: Record<DataCardTone, string> = {
  surface: "theme-card-soft",
  tint: "border border-[var(--theme-border)] bg-[var(--theme-cream)]",
  deep: "theme-card-deep",
};

export function DataCard({ label, value, hint, tone = "surface", href, onClick, ariaLabel }: DataCardProps) {
  const isDeep = tone === "deep";
  const articleClassName = `${toneMap[tone]} rounded-3xl px-4 py-4`;

  const content = (
    <div className={articleClassName}>
      <p className={`text-sm ${isDeep ? "text-white/75" : "text-[var(--theme-muted)]"}`}>{label}</p>
      <p className={`mt-3 text-3xl font-display leading-none ${isDeep ? "text-white" : "text-[var(--theme-navy)]"}`}>
        {value}
      </p>
      {hint ? (
        <p className={`mt-3 text-sm leading-relaxed ${isDeep ? "text-white/82" : "text-[var(--theme-body)]"}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-3xl transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-purple-secondary)]"
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="group block w-full rounded-3xl border-0 bg-transparent p-0 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-purple-secondary)]"
      >
        {content}
      </button>
    );
  }

  return <article>{content}</article>;
}
