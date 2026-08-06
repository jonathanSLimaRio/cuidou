import { CuidouMark } from "@/components/brand/cuidou-mark";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="theme-container grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <CuidouMark size="desktop" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--theme-muted)]">
            Conexões de cuidado com mais contexto, clareza e respeito às pessoas envolvidas.
          </p>
        </div>
        <nav aria-label="Cuidou" className="grid content-start gap-2 text-sm">
          <p className="font-display text-[var(--theme-plum)]">Explore</p>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/marketplace/professionals">Profissionais</Link>
          <Link href="/marketplace/jobs">Vagas</Link>
        </nav>
        <nav aria-label="Informações legais" className="grid content-start gap-2 text-sm">
          <p className="font-display text-[var(--theme-plum)]">Legal e suporte</p>
          <Link href="/terms">Termos de Uso</Link>
          <Link href="/privacy">Privacidade</Link>
          <a href="mailto:privacidade@cuidou.com.br">Falar sobre privacidade</a>
        </nav>
      </div>
      <div className="border-t border-[var(--theme-border)] py-4 text-center text-xs text-[var(--theme-muted)]">
        © {new Date().getFullYear()} Cuidou. Todos os direitos reservados.
      </div>
    </footer>
  );
}
