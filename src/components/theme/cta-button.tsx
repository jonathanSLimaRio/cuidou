import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "soft" | "light";
type ButtonSize = "sm" | "md" | "lg";

type CtaButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--theme-indigo)] text-white shadow-[0_14px_30px_-18px_var(--theme-indigo)] hover:bg-[var(--theme-indigo-strong)]",
  outline:
    "border border-[var(--theme-indigo)] text-[var(--theme-indigo)] hover:bg-[var(--theme-indigo)] hover:text-white",
  soft:
    "bg-white text-[var(--theme-indigo)] shadow-[0_10px_24px_-18px_var(--theme-indigo)] hover:bg-[var(--theme-sky)] hover:text-[var(--theme-navy)]",
  light:
    "border border-white/50 bg-white/20 text-white backdrop-blur hover:bg-white/35",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CtaButton({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  type,
  ...buttonProps
}: CtaButtonProps) {
  const classes = joinClasses(
    "inline-flex items-center justify-center rounded-full font-display font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-indigo)]",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type ?? "button"}
      className={classes}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
