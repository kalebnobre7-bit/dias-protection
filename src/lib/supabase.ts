import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client do Supabase para o navegador (anon key + RLS). As variáveis entram no bundle no build:
// sem elas o painel abre, mas avisa que não está conectado.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = url.length > 0 && anonKey.length > 0;

export const SUPABASE_SETUP_MESSAGE =
  "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no build (Vercel, GitHub e .env.local).";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  client ??= createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  return client;
}

export function requireSupabase(): SupabaseClient {
  const c = getSupabase();
  if (!c) throw new Error(SUPABASE_SETUP_MESSAGE);
  return c;
}
