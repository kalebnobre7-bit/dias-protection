"use client";

import { useEffect, useState } from "react";

import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";

// Login real pelo Supabase Auth (um único usuário, criado à mão no painel do Supabase)

export async function signIn(email: string, password: string): Promise<boolean> {
  if (!supabaseConfigured) return false;
  const { error } = await getBrowserClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  return !error;
}

export async function signOut(): Promise<void> {
  if (supabaseConfigured) await getBrowserClient().auth.signOut();
}

export function useSession(): "loading" | "in" | "out" {
  const [state, setState] = useState<"loading" | "in" | "out">("loading");
  useEffect(() => {
    if (!supabaseConfigured) {
      setState("out");
      return;
    }
    const auth = getBrowserClient().auth;
    auth.getSession().then(({ data }) => setState(data.session ? "in" : "out"));
    const { data } = auth.onAuthStateChange((_event, session) => setState(session ? "in" : "out"));
    return () => data.subscription.unsubscribe();
  }, []);
  return state;
}
