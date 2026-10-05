// Importa um JSON exportado pelo painel (aba Dados, ou o localStorage antigo) no Supabase, pela linha de comando.
// O mesmo código da aba Dados: ids de exemplo viram UUID, fotos em data URL vão para o Storage.
//
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
//   node --experimental-strip-types --no-warnings scripts/import-json.mjs caminho/para/dados.json
//
// A service role key ignora o RLS: use só aqui, nunca no navegador.

import { readFile } from "node:fs/promises";

import { createClient } from "@supabase/supabase-js";

import { countRows, importDatabase, normalizeDatabase } from "../src/lib/admin/migrate.ts";

const file = process.argv[2];
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!file || !url || !key) {
  console.error("Uso: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node --experimental-strip-types scripts/import-json.mjs dados.json");
  process.exit(1);
}

const db = normalizeDatabase(JSON.parse(await readFile(file, "utf8")));
if (!countRows(db)) {
  console.error("O arquivo não tem dados do painel.");
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false } });
try {
  await importDatabase(client, db, (p) => console.log(`[${p.done}/${p.total}] ${p.step}`));
  console.log(`Importado: ${countRows(db)} registro(s).`);
} catch (e) {
  console.error(`Falhou: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}
