"use client";

import { ArrowLeft as IconBack, Printer as IconPrint } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AgentCv, DocBrandHeader, DocSheet, DocShell as Shell } from "@/components/admin/doc";
import { ProposalDocument } from "@/components/admin/ProposalDocument";
import { localContent } from "@/data/content";
import { useSession } from "@/lib/admin/auth";
import { formatDateLong, proposalStatusLabel } from "@/lib/admin/labels";
import { DOC_LABELS, type DocLang } from "@/lib/admin/proposal-i18n";
import { useSettings } from "@/lib/admin/settings";
import { useTable } from "@/lib/admin/store";

// Documento A4 da proposta: folha branca, pronto para imprimir ou salvar em PDF.
// Rota estática (funciona no export do GitHub Pages); a proposta vem de ?id= e o modo de ?modo=
// - comercial: apresenta equipe e veículos, sem contato nem documentos dos prestadores
// - fechado: serviço confirmado, com currículo, contato e CNH de cada agente e placa dos veículos
export default function ProposalDocumentPage() {
  const session = useSession();
  const { rows: proposals, loading } = useTable("proposals");
  const { rows: clients } = useTable("clients");
  const { rows: agents } = useTable("agents");
  const { rows: vehicles } = useTable("vehicles");
  const { settings, loading: settingsLoading } = useSettings();
  const [id, setId] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [langChoice, setLangChoice] = useState<DocLang | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setId(params.get("id"));
    setClosed(params.get("modo") === "fechado");
  }, []);

  if (session === "loading" || loading || settingsLoading || id === null) return <div className="min-h-dvh bg-[#e9ebee]" />;
  if (session === "out") {
    return (
      <Shell>
        <p className="text-center text-muted">
          Faça login no{" "}
          <Link href="/admin/login" className="text-accent">
            painel
          </Link>{" "}
          para ver este documento.
        </p>
      </Shell>
    );
  }

  const p = proposals.find((x) => x.id === id);
  if (!p) {
    return (
      <Shell>
        <p className="text-center text-muted">Proposta não encontrada.</p>
      </Shell>
    );
  }

  const client = clients.find((c) => c.id === p.clientId) ?? null;
  const team = p.agentIds.map((x) => agents.find((a) => a.id === x)).filter((a) => a !== undefined);
  const fleet = p.vehicleIds.map((x) => vehicles.find((v) => v.id === x)).filter((v) => v !== undefined);
  // Padrão vem do idioma do cliente; dá para trocar na barra
  const lang: DocLang = langChoice ?? (client?.language === "en" ? "en" : "pt");
  const t = DOC_LABELS[lang];
  // Marca fixa do site; contato e assinatura vêm de Configurações
  const company = { ...settings.company, brandName: localContent.company.brandName, tagline: localContent.company.tagline };

  return (
    <Shell
      toolbar={
        <>
          <Link href="/admin/propostas" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-[0.9375rem] hover:border-silver">
            <IconBack className="size-4" /> Propostas
          </Link>
          <span className="text-[0.875rem] text-muted">
            {p.number} · {proposalStatusLabel[p.status]}
          </span>
          <div className="inline-flex gap-x-1" role="tablist" aria-label="Tipo de documento">
            {([
              [false, "Proposta comercial"],
              [true, "Serviço fechado"],
            ] as const).map(([value, label]) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={closed === value}
                onClick={() => {
                  setClosed(value);
                  const url = new URL(window.location.href);
                  if (value) url.searchParams.set("modo", "fechado");
                  else url.searchParams.delete("modo");
                  window.history.replaceState(null, "", url);
                }}
                className={`min-h-9 border-b-2 px-3 text-[0.875rem] font-medium transition-colors duration-200 ${
                  closed === value ? "border-text text-text" : "border-transparent text-muted hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="inline-flex gap-x-1" role="group" aria-label="Idioma do documento">
            {(["pt", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => setLangChoice(l)}
                className={`min-h-9 border-b-2 px-3 text-[0.875rem] font-medium transition-colors duration-200 ${
                  lang === l ? "border-text text-text" : "border-transparent text-muted hover:text-text"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
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
      <ProposalDocument
        p={p}
        categories={p.pricing ? Object.fromEntries(p.pricing.costs.map((c) => [c.id, c.category])) : null}
        client={client}
        team={team}
        fleet={fleet}
        company={company}
        lang={lang}
        closed={closed}
      />

      {/* Serviço fechado: um currículo completo por agente, cada um em página própria */}
      {closed &&
        team.map((a) => (
          <DocSheet key={a.id} className="mt-8 print:mt-0 print:break-before-page">
            <DocBrandHeader kind={t.assignedTeam} />
            <div className="mt-8">
              <AgentCv agent={a} withPrivate lang={lang} />
            </div>
          </DocSheet>
        ))}
      <p className="mx-auto mt-6 max-w-[210mm] text-center text-xs text-muted print:hidden">
        Gerado em {formatDateLong(new Date().toISOString())}. Na janela de impressão, escolha “Salvar como PDF” e desative cabeçalhos e rodapés.
      </p>
    </Shell>
  );
}
