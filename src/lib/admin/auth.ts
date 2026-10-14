"use client";

import { useEffect, useState } from "react";

// Login de demonstração (só até o Supabase Auth entrar; não protege nada de verdade)
const DEMO_LOGIN = { email: "gabriel@diasprotection.com", password: "dias2026" };

// Sessão de demonstração. Na Fase B vira Supabase Auth (signInWithPassword / getSession).
const KEY = "dias-admin:session";

export async function signIn(email: string, password: string): Promise<boolean> {
  const ok = email.trim().toLowerCase() === DEMO_LOGIN.email && password === DEMO_LOGIN.password;
  if (ok) localStorage.setItem(KEY, "1");
  return ok;
}

export async function signOut(): Promise<void> {
  localStorage.removeItem(KEY);
}

export function useSession(): "loading" | "in" | "out" {
  const [state, setState] = useState<"loading" | "in" | "out">("loading");
  useEffect(() => {
    try {
      setState(localStorage.getItem(KEY) ? "in" : "out");
    } catch {
      setState("out");
    }
  }, []);
  return state;
}
