type BlobTone = "pink" | "blue" | "yellow" | "indigo";

type BlobDecorProps = {
  tone?: BlobTone;
  className?: string;
};

const toneClassMap: Record<BlobTone, string> = {
  pink: "from-[var(--theme-pink)] to-[#ffd2df]",
  blue: "from-[var(--theme-sky)] to-[#b9ecff]",
  yellow: "from-[var(--theme-yellow)] to-[#ffe9ba]",
  indigo: "from-[var(--theme-indigo)] to-[var(--theme-indigo-strong)]",
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function BlobDecor({ tone = "pink", className }: BlobDecorProps) {
  return (
    <span
      aria-hidden
      className={joinClasses(
        "pointer-events-none absolute block rounded-[58%_42%_37%_63%/42%_39%_61%_58%] bg-gradient-to-br opacity-90 blur-[1px] animate-float-slow",
        toneClassMap[tone],
        className,
      )}
    />
  );
}
