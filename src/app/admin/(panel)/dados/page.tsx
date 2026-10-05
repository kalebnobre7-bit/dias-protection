"use client";

import { useEffect, useRef, useState } from "react";
import { Download as IconDownload, Trash2 as IconTrash, Upload as IconUpload } from "lucide-react";

import { Badge, Button, PageHeader, Section } from "@/components/admin/ui";
import {
  countRows,
  importDatabase,
  LEGACY_KEY,
  normalizeDatabase,
  readLegacy,
  TABLE_NAMES,
  type ImportProgress,
} from "@/lib/admin/migrate";
import { repo } from "@/lib/admin/store";
import type { Database } from "@/lib/admin/types";
import { requireSupabase } from "@/lib/supabase";

const LABELS: Record<keyof Database, string> = {
  agents: "agentes",
  vehicles: "veículos",
  clients: "clientes",
  partners: "parceiros",
  jobs: "serviços",
  jobCosts: "custos",
  transactions: "lançamentos",
  proposals: "propostas",
};

const summary = (db: Database) =>
  TABLE_NAMES.filter((t) => db[t].length)
    .map((t) => `${db[t].length} ${LABELS[t]}`)
    .join(" · ") || "nada";

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export default function DataPage() {
  const [legacy, setLegacy] = useState<Database | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [armed, setArmed] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setLegacy(readLegacy(localStorage));
    } catch {
      setLegacy(null);
    }
  }, []);

  const runImport = async (db: Database, origin: string) => {
    setStatus(null);
    setProgress({ step: "Preparando", done: 0, total: 1 });
    try {
      await importDatabase(requireSupabase(), db, setProgress);
      repo.refresh();
      setStatus({ ok: true, text: `Importado de ${origin}: ${summary(db)}.` });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : "Não foi possível importar." });
    } finally {
      setProgress(null);
    }
  };

  const importFile = async (f: File) => {
    try {
      const db = normalizeDatabase(JSON.parse(await f.text()));
      if (!countRows(db)) return setStatus({ ok: false, text: "O arquivo não tem dados do painel." });
      await runImport(db, f.name);
    } catch {
      setStatus({ ok: false, text: "Arquivo inválido: use um JSON exportado por este painel." });
    }
  };

  const backup = async () => {
    setStatus(null);
    try {
      const entries = await Promise.all(TABLE_NAMES.map(async (t) => [t, await repo.list(t)] as const));
      download(`dias-protection-${stamp()}.json`, Object.fromEntries(entries));
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : "Não foi possível exportar." });
    }
  };

  const wipe = async () => {
    if (!armed) return setArmed(true);
    setArmed(false);
    setStatus(null);
    try {
      await repo.reset();
      setStatus({ ok: true, text: "Todos os dados foram apagados." });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : "Não foi possível apagar." });
    }
  };

  const forgetLegacy = () => {
    localStorage.removeItem(LEGACY_KEY);
    setLegacy(null);
  };

  return (
    <>
      <PageHeader title="Dados" subtitle="Backup, importação e a migração do painel antigo (que gravava só neste navegador)." />

      {status && (
        <p
          role="status"
          className={`mb-6 rounded-2xl border p-4 text-[0.9375rem] ${status.ok ? "border-line text-[#8fd6a5]" : "border-danger/40 text-danger"}`}
        >
          {status.text}
        </p>
      )}
      {progress && (
        <p role="status" className="mb-6 rounded-2xl border border-line p-4 text-[0.9375rem] text-muted">
          Importando… {progress.step} ({progress.done}/{progress.total})
        </p>
      )}

      {legacy && (
        <Section title="Dados antigos deste navegador" className="mb-10">
          <div className="space-y-4 rounded-2xl border border-[#e8c27a]/40 bg-[#e8c27a]/6 p-4">
            <p className="text-[0.9375rem]">
              Este navegador ainda guarda o que foi cadastrado antes do Supabase: <span className="text-text">{summary(legacy)}</span>.
              Importe para o banco (fotos vão para o Storage) e depois apague a cópia antiga.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => runImport(legacy, "este navegador")} disabled={!!progress}>
                <IconUpload className="size-4" /> Importar no Supabase
              </Button>
              <Button variant="secondary" onClick={() => download(`dias-protection-antigo-${stamp()}.json`, legacy)}>
                <IconDownload className="size-4" /> Baixar JSON
              </Button>
              <Button variant="ghost" onClick={forgetLegacy}>
                Apagar cópia antiga
              </Button>
            </div>
          </div>
        </Section>
      )}

      <div className="grid gap-10 lg:grid-cols-2 [&>*]:min-w-0">
        <Section title="Backup">
          <div className="space-y-3 rounded-2xl border border-line p-4">
            <p className="text-[0.9375rem] text-muted">Baixa tudo que está no Supabase em um JSON (fotos ficam como links).</p>
            <Button variant="secondary" onClick={backup}>
              <IconDownload className="size-4" /> Exportar JSON
            </Button>
          </div>
        </Section>

        <Section title="Importar JSON">
          <div className="space-y-3 rounded-2xl border border-line p-4">
            <p className="text-[0.9375rem] text-muted">
              Um arquivo exportado por este painel (novo ou antigo). Registros com o mesmo id são atualizados, não duplicados.
            </p>
            <Button variant="secondary" onClick={() => file.current?.click()} disabled={!!progress}>
              <IconUpload className="size-4" /> Escolher arquivo
            </Button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </Section>
      </div>

      <Section title="Zona de perigo" className="mt-10">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-danger/30 p-4">
          <p className="min-w-0 flex-1 text-[0.9375rem] text-muted">
            Apaga agentes, veículos, clientes, parceiros, serviços, custos, lançamentos e propostas do Supabase. Fotos no Storage ficam.
          </p>
          <Button variant="danger" onClick={wipe} onBlur={() => setArmed(false)}>
            <IconTrash className="size-4" /> {armed ? "Apagar tudo? Toque de novo" : "Apagar todos os dados"}
          </Button>
          {armed && <Badge tone="bad">Sem volta</Badge>}
        </div>
      </Section>
    </>
  );
}
