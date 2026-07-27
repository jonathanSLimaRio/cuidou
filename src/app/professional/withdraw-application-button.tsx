"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WithdrawApplicationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function withdraw() {
    if (!window.confirm("Retirar esta candidatura? A família será avisada e a ação não pode ser desfeita.")) return;
    setPending(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}/withdraw`, { method: "POST" });
      if (!response.ok) throw new Error("withdraw_failed");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" className="mt-4 rounded-xl border border-[var(--theme-border)] px-4 py-2 text-sm font-semibold text-[var(--theme-navy)] disabled:opacity-60" onClick={withdraw} disabled={pending}>
      {pending ? "Retirando..." : "Retirar candidatura"}
    </button>
  );
}
