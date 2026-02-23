import { auth, signIn, signOut } from "@/auth";
import Link from "next/link";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
          Cuidou
        </Link>

        <nav className="flex items-center gap-4 text-sm text-zinc-700">
          <Link href="/marketplace/jobs" className="hover:text-zinc-900">
            Vagas
          </Link>
          <Link href="/marketplace/professionals" className="hover:text-zinc-900">
            Profissionais
          </Link>

          {session?.user ? (
            <>
              <Link href="/dashboard" className="hover:text-zinc-900">
                Dashboard
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-md border border-black/10 px-3 py-1.5 hover:bg-zinc-50"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800"
              >
                Entrar com Google
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
