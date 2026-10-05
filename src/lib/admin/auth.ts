"use client";

import { useEffect, useState } from "react";

import { getSupabase, SUPABASE_SETUP_MESSAGE } from "@/lib/supabase";

// Supabase Auth com e-mail e senha. O usuário do Gabriel é criado no painel do Supabase
// (Authentication → Users); a sessão fica persistida no navegador e renova sozinha.

export type SessionState = "loading" | "in" | "out";

const FRIENDLY: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme o e-mail antes de entrar.",
  over_request_rate_limit: "Muitas tentativas. Aguarde um minuto e tente de novo.",
};

export async function signIn(email: string, password: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const client = getSupabase();
  if (!client) return { ok: false, message: SUPABASE_SETUP_MESSAGE };
  const { error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (!error) return { ok: true };
  const code = (error as { code?: string }).code ?? "";
  return {
    ok: false,
    message: FRIENDLY[code] ?? (error.message === "Invalid login credentials" ? FRIENDLY.invalid_credentials : error.message),
  };
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>("loading");

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setState("out");
      return;
    }
    let alive = true;
    client.auth.getSession().then(({ data }) => alive && setState(data.session ? "in" : "out"));
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => alive && setState(session ? "in" : "out"));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
