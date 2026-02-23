import { AppIcon } from "@/components/theme/app-icon";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonVariant = "primary" | "secondary" | "soft";
type ActionButtonSize = "sm" | "md";
type IconPosition = "left" | "right";

type ActionButtonProps = {
  children: ReactNode;
  icon: LucideIcon;
  href?: string;
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  iconPosition?: IconPosition;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<ActionButtonVariant, string> = {
  primary:
    "btn-primary !text-white hover:!text-white active:!text-white focus-visible:!text-white visited:!text-white",
  secondary:
    "btn-secondary text-[var(--brand-purple-primary)] hover:text-white active:text-white visited:text-[var(--brand-purple-primary)]",
  soft: "btn-soft",
};

const sizeClasses: Record<ActionButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ActionButton({
  children,
  icon,
  href,
  variant = "primary",
  size = "md",
  iconPosition = "left",
  className,
  type,
  ...buttonProps
}: ActionButtonProps) {
  const iconNode = <AppIcon icon={icon} size={size === "sm" ? "sm" : "md"} />;
  const content =
    iconPosition === "right" ? (
      <>
        <span>{children}</span>
        {iconNode}
      </>
    ) : (
      <>
        {iconNode}
        <span>{children}</span>
      </>
    );

  const classes = joinClasses(
    "inline-flex items-center justify-center gap-2 rounded-full font-display font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-purple-secondary)]",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type ?? "button"} className={classes} {...buttonProps}>
      {content}
    </button>
  );
}
