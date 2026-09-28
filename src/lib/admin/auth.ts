"use client";

import { useEffect, useState } from "react";

import { DEMO_LOGIN } from "./seed";

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
