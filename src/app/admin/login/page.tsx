import { auth } from "@/auth";
import { CredentialsLoginForm } from "@/components/auth/credentials-login-form";
import { BlobDecor } from "@/components/theme/blob-decor";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  next?: string;
  error?: string;
  code?: string;
}>;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolvedSearchParams.next || "/admin";

  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect(nextPath);
  }

  return (
    <main className="theme-page bg-slate-900 min-h-screen flex items-center justify-center p-4">
      <BlobDecor tone="pink" className="fixed -right-20 -top-20 h-96 w-96 opacity-20 blur-3xl pointer-events-none" />
      <BlobDecor tone="blue" className="fixed -left-20 -bottom-20 h-96 w-96 opacity-20 blur-3xl pointer-events-none" />

      <section className="theme-card relative z-10 w-full max-w-md p-6 sm:p-8 lg:p-10 shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="theme-chip theme-chip-blue mx-auto mb-4 w-fit">Cuidou Backoffice</p>
          <h1 className="text-3xl text-white font-medium">Acesso Restrito</h1>
          <p className="mt-3 text-sm text-[var(--theme-muted)] leading-relaxed">
            Painel exclusivo para a administração da plataforma.
          </p>
        </div>

        <CredentialsLoginForm
          nextPath={nextPath}
          initialCode={resolvedSearchParams.code}
          initialError={resolvedSearchParams.error}
        />
      </section>
    </main>
  );
}
