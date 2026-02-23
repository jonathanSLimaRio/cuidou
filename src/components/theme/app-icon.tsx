import type { LucideIcon } from "lucide-react";

type AppIconSize = "sm" | "md" | "lg";

type AppIconProps = {
  icon: LucideIcon;
  size?: AppIconSize;
  className?: string;
  strokeWidth?: number;
  ariaHidden?: boolean;
};

const sizeMap: Record<AppIconSize, number> = {
  sm: 16,
  md: 18,
  lg: 22,
};

export function AppIcon({
  icon: Icon,
  size = "md",
  className,
  strokeWidth = 2.2,
  ariaHidden = true,
}: AppIconProps) {
  return (
    <Icon
      aria-hidden={ariaHidden}
      size={sizeMap[size]}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
