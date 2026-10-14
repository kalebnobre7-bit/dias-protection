import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Só a URL e a chave pública (publishable): quem protege os dados é o RLS do banco.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

// Painel (navegador): guarda a sessão do login do Gabriel
let browserClient: SupabaseClient | null = null;
export function getBrowserClient(): SupabaseClient {
  if (!url || !anonKey) throw new Error("Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  browserClient ??= createClient(url, anonKey);
  return browserClient;
}

// Site público (servidor): só leitura anônima, com cache de 60 s para o site seguir estático
export function getPublicClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60 } }) },
  });
}
