import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-black/10 bg-white p-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Entrar na Cuidou</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Login social com Google para famílias, profissionais e admin.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Continuar com Google
          </button>
        </form>
      </section>
    </main>
  );
}
