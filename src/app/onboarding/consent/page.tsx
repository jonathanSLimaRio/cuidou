import { auth } from "@/auth";
import { ConsentForm } from "./consent-form";
import { PageHeader } from "@/components/theme/page-header";
import { currentLegalDocuments, hasCurrentLegalConsent } from "@/lib/legal-consent";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ActionButton } from "@/components/theme/action-button";
import { ArrowRight } from "lucide-react";
import { refreshLegalConsentSession } from "./actions";

export const metadata = { title: "Atualização de consentimento | Cuidou" };
export const dynamic = "force-dynamic";

export default async function ConsentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      acceptedTermsAt: true,
      acceptedPrivacyAt: true,
      acceptedTermsVersion: true,
      acceptedPrivacyVersion: true,
    },
  });
  const alreadyAccepted = hasCurrentLegalConsent(user);

  const documents = currentLegalDocuments();
  return (
    <main id="main-content" className="theme-page">
      <div className="theme-container max-w-3xl">
        <PageHeader
          eyebrow="Privacidade e transparência"
          title="Revise os documentos atuais"
          description={`Para continuar, confirme as versões ${documents.terms.version} dos Termos e ${documents.privacy.version} da Política de Privacidade.`}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Consentimento" }]}
        />
        <section className="theme-card mt-6 rounded-[28px] p-6 sm:p-8">
          <h2 className="text-2xl">Seu aceite fica registrado de forma auditável</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--theme-body)]">
            Você pode abrir cada documento em uma nova aba antes de decidir. A data e a versão aceita serão vinculadas à sua conta.
          </p>
          {alreadyAccepted ? (
            <form action={refreshLegalConsentSession} className="mt-6">
              <p className="mb-4 text-sm text-[var(--theme-muted)]">
                Seu aceite já foi registrado. Atualize sua sessão para continuar.
              </p>
              <ActionButton className="w-full" type="submit" icon={ArrowRight}>
                Continuar para o painel
              </ActionButton>
            </form>
          ) : (
            <ConsentForm />
          )}
        </section>
      </div>
    </main>
  );
}
