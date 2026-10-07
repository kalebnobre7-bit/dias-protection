"use client";

import { ArrowLeft as IconBack, Printer as IconPrint } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AgentCv, DocBrandHeader, DocSheet, DocShell } from "@/components/admin/doc";
import { localContent } from "@/data/content";
import { useSession } from "@/lib/admin/auth";
import { formatDateLong } from "@/lib/admin/labels";
import { useTable } from "@/lib/admin/store";

// Currículo do agente em A4. Rota estática (export do GitHub Pages); o agente vem de ?id=
export default function AgentCvPage() {
  const session = useSession();
  const { rows: agents, loading } = useTable("agents");
  const [id, setId] = useState<string | null>(null);
  const [withPrivate, setWithPrivate] = useState(false);

  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  if (session === "loading" || loading || id === null) return <div className="min-h-dvh bg-[#e9ebee]" />;
  if (session === "out") {
    return (
      <DocShell>
        <p className="text-center text-muted">
          Faça login no{" "}
          <Link href="/admin/login" className="text-accent">
            painel
          </Link>{" "}
          para ver este documento.
        </p>
      </DocShell>
    );
  }

  const agent = agents.find((a) => a.id === id);
  if (!agent) {
    return (
      <DocShell>
        <p className="text-center text-muted">Agente não encontrado.</p>
      </DocShell>
    );
  }

  const { company } = localContent;

  return (
    <DocShell
      toolbar={
        <>
          <Link href="/admin/agentes" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-[0.9375rem] hover:border-silver">
            <IconBack className="size-4" /> Agentes
          </Link>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[0.9375rem]">
            <input type="checkbox" checked={withPrivate} onChange={(e) => setWithPrivate(e.target.checked)} className="size-4 accent-[#34c759]" />
            Incluir contato e CNH
          </label>
          <button
            type="button"
            onClick={() => window.print()}
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-text px-5 text-[0.9375rem] font-medium text-ink hover:bg-white"
          >
            <IconPrint className="size-4" /> Imprimir / Salvar PDF
          </button>
        </>
      }
    >
      <DocSheet>
        <DocBrandHeader kind="Currículo" />
        <div className="mt-8">
          <AgentCv agent={agent} withPrivate={withPrivate} />
        </div>
        <footer className="mt-10 border-t border-[#141922]/15 pt-4 text-[0.75rem] text-[#141922]/55">
          {company.brandName} · {company.tagline}
        </footer>
      </DocSheet>
      <p className="mx-auto mt-6 max-w-[210mm] text-center text-xs text-muted print:hidden">
        Gerado em {formatDateLong(new Date().toISOString())}. Na janela de impressão, escolha “Salvar como PDF” e desative cabeçalhos e rodapés.
      </p>
    </DocShell>
  );
}
