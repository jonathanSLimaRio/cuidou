import Image from "next/image";

type CuidouMarkProps = {
  size?: "desktop" | "mobile";
  priority?: boolean;
};

const config = {
  desktop: {
    symbol: { width: 38, height: 38 },
    wordmark: { width: 150, height: 38 },
  },
  mobile: {
    symbol: { width: 34, height: 34 },
    wordmark: { width: 126, height: 32 },
  },
} as const;

export function CuidouMark({ size = "desktop", priority = false }: CuidouMarkProps) {
  const selected = config[size];

  return (
    <span className="inline-flex min-h-10 items-center gap-2.5">
      <Image
        src="/brand/cuidou-symbol.png"
        alt="Logo Cuidou"
        width={selected.symbol.width}
        height={selected.symbol.height}
        priority={priority}
        className="h-auto w-auto"
      />
      <Image
        src="/brand/cuidou-wordmark.png"
        alt="Cuidou"
        width={selected.wordmark.width}
        height={selected.wordmark.height}
        priority={priority}
        className="h-auto w-auto"
      />
    </span>
  );
}
