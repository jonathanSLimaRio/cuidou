import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingRoleForm } from "./role-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "FAMILY") {
    redirect("/family");
  }

  if (session.user.role === "PROFESSIONAL") {
    redirect("/professional");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-2xl items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-black/10 bg-white p-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Defina seu perfil</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Escolha como você quer usar a plataforma. Esse papel é fixo na V1.
        </p>
        <OnboardingRoleForm />
      </section>
    </main>
  );
}
