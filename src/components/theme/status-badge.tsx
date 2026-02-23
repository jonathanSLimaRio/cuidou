import { AppIcon } from "@/components/theme/app-icon";
import {
  AlertCircle,
  AlertTriangle,
  BadgeInfo,
  CheckCircle2,
  CircleDotDashed,
  Shield,
  Sparkles,
  Star,
} from "lucide-react";
import type { ReactNode } from "react";

type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "pink"
  | "blue"
  | "yellow"
  | "indigo";

type StatusBadgeProps = {
  tone?: StatusTone;
  hideIcon?: boolean;
  children: ReactNode;
};

const toneMap: Record<StatusTone, string> = {
  success: "theme-chip-success",
  warning: "theme-chip-warning",
  danger: "theme-chip-danger",
  info: "theme-chip-info",
  neutral: "theme-chip-neutral",
  pink: "theme-chip-pink",
  blue: "theme-chip-blue",
  yellow: "theme-chip-yellow",
  indigo: "theme-chip-indigo",
};

const toneIconMap = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: BadgeInfo,
  neutral: CircleDotDashed,
  pink: Sparkles,
  blue: Shield,
  yellow: Star,
  indigo: Shield,
} as const;

export function StatusBadge({ tone = "neutral", hideIcon = false, children }: StatusBadgeProps) {
  const icon = toneIconMap[tone];

  return (
    <span className={`theme-chip ${toneMap[tone]}`}>
      {!hideIcon ? <AppIcon icon={icon} size="sm" /> : null}
      {children}
    </span>
  );
}
