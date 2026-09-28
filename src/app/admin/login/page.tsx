"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Emblem } from "@/components/brand/Logo";
import { Button, Field } from "@/components/admin/ui";
import { signIn, useSession } from "@/lib/admin/auth";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session === "in") router.replace("/admin");
  }, [session, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await signIn(email, password);
    setBusy(false);
    if (ok) router.replace("/admin");
    else setError("E-mail ou senha incorretos.");
  };

  return (
    <main className="relative isolate grid min-h-dvh place-items-center px-4">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,var(--color-navy-2)_0%,var(--color-ink)_70%)]"
      />
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Emblem className="h-16 text-text" />
          <h1 className="mt-6 text-[1.75rem] font-semibold tracking-[-0.03em]">Painel Dias Protection</h1>
          <p className="mt-1 text-[0.9375rem] text-muted">Entre para gerenciar serviços, equipe e financeiro.</p>
        </div>
        <div className="space-y-4 rounded-3xl border border-line bg-navy/60 p-6">
          <Field label="E-mail">
            <input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Senha">
            <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="text-[0.875rem] text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            Entrar
          </Button>
        </div>
      </form>
    </main>
  );
}
