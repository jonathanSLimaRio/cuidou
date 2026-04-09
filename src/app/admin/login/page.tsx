import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
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

  // If someone is logged in but NOT admin, we show an access denied message.
  // They likely tried to access /admin while logged in as regular user.
  const isNonAdminLoggedIn = !!session?.user && session.user.role !== ("ADMIN" as string);

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

        {isNonAdminLoggedIn ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            <p className="font-semibold">Acesso negado</p>
            <p className="mt-1 leading-relaxed">
              Sua conta não tem permissão de acesso ao painel administrativo.
              Se você é um usuário da plataforma, acesse o{" "}
              <a href="/dashboard" className="underline hover:text-red-100">
                painel de usuário
              </a>
              .
            </p>
          </div>
        ) : (
          <AdminLoginForm
            nextPath={nextPath}
            initialCode={resolvedSearchParams.code}
            initialError={resolvedSearchParams.error}
          />
        )}
      </section>
    </main>
  );
}
