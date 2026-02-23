import { AppIcon } from "@/components/theme/app-icon";
import {
  BriefcaseBusiness,
  FileSearch,
  MessageCircleHeart,
  NotebookPen,
  SearchX,
  UserRoundSearch,
} from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode | "vaga" | "vagas" | "perfil" | "chat" | "candidatura";
};

function resolveIcon(icon?: EmptyStateProps["icon"]) {
  if (!icon) {
    return <AppIcon icon={SearchX} size="lg" />;
  }

  if (typeof icon !== "string") {
    return icon;
  }

  if (icon === "vaga") {
    return <AppIcon icon={FileSearch} size="lg" />;
  }

  if (icon === "vagas") {
    return <AppIcon icon={BriefcaseBusiness} size="lg" />;
  }

  if (icon === "perfil") {
    return <AppIcon icon={UserRoundSearch} size="lg" />;
  }

  if (icon === "chat") {
    return <AppIcon icon={MessageCircleHeart} size="lg" />;
  }

  if (icon === "candidatura") {
    return <AppIcon icon={NotebookPen} size="lg" />;
  }

  return <AppIcon icon={SearchX} size="lg" />;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <section className="theme-card-soft rounded-[30px] px-6 py-8 text-center">
      <div className="mx-auto inline-flex min-h-12 min-w-12 items-center justify-center rounded-full bg-[var(--theme-cream)] text-xl text-[var(--theme-indigo)]">
        {resolveIcon(icon)}
      </div>
      <h2 className="mt-4 text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--theme-muted)]">
        {description}
      </p>
      {action ? <div className="mt-5 flex items-center justify-center">{action}</div> : null}
    </section>
  );
}
