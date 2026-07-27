"use client";

import { useState } from "react";

export function LeadCaptureForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing", consent: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível cadastrar seu e-mail.");
      setStatus("success");
      setMessage(payload.alreadySubscribed ? "Este e-mail já está na nossa lista." : "Pronto! Avisaremos você sobre as novidades.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível cadastrar seu e-mail.");
    }
  }

  return (
    <form className="flex w-full flex-col gap-2 sm:flex-row md:w-auto" onSubmit={submit} aria-describedby="lead-capture-status">
      <label htmlFor="lead-email" className="sr-only">Seu e-mail</label>
      <input
        id="lead-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Seu e-mail"
        autoComplete="email"
        required
        disabled={status === "loading"}
        className="theme-field min-w-[14rem]"
      />
      <button type="submit" disabled={status === "loading"} className="theme-button theme-button-primary rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
        {status === "loading" ? "Enviando..." : "Quero receber"}
      </button>
      <p id="lead-capture-status" role="status" aria-live="polite" className={`basis-full text-xs ${status === "error" ? "text-red-600" : "text-[var(--theme-muted)]"}`}>
        {message}
      </p>
    </form>
  );
}
