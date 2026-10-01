"use client";

import { ArrowLeft as IconBack, Printer as IconPrint } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Emblem, Wordmark } from "@/components/brand/Logo";
import { localContent } from "@/data/content";
import { useSession } from "@/lib/admin/auth";
import { serviceTypeName } from "@/lib/admin/catalog";
import { brl, formatDate, formatDateLong, proposalStatusLabel } from "@/lib/admin/labels";
import { itemTotal, proposalTotals } from "@/lib/admin/proposals";
import { useTable } from "@/lib/admin/store";

// Documento A4 da proposta: folha branca, pronto para imprimir ou salvar em PDF.
// Rota estática (funciona no export do GitHub Pages); a proposta vem de ?id=
export default function ProposalDocumentPage() {
  const session = useSession();
  const { rows: proposals, loading } = useTable("proposals");
  const { rows: clients } = useTable("clients");
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  if (session === "loading" || loading || id === null) return <div className="min-h-dvh bg-[#e9ebee]" />;
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
  const { company } = localContent;
  const totals = proposalTotals(p);
  const terms = p.terms
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
  const phone = `+${company.whatsapp.slice(0, 2)} ${company.whatsapp.slice(2, 4)} ${company.whatsapp.slice(4, -4)}-${company.whatsapp.slice(-4)}`;

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
      <article className="doc-sheet mx-auto w-full max-w-[210mm] bg-white text-[#141922] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] print:max-w-none print:shadow-none">
        <div className="px-[14mm] py-[14mm] md:px-[18mm] md:py-[16mm]">
          {/* Cabeçalho: marca + número */}
          <header className="flex items-start justify-between gap-6 border-b border-[#141922]/15 pb-6">
            <div className="flex items-center gap-3 text-[#141922]">
              <Emblem className="h-14" />
              <Wordmark className="h-12" />
            </div>
            <div className="text-right">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[#141922]/55">Proposta comercial</p>
              <p className="num mt-1 text-[1.75rem] font-semibold leading-none tracking-[-0.03em]">{p.number}</p>
              <p className="mt-2 text-[0.8125rem] text-[#141922]/65">
                Emitida em {formatDate(p.issuedAt)} · válida até {formatDate(p.validUntil)}
              </p>
            </div>
          </header>

          {/* Título + partes */}
          <section className="mt-8">
            <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] md:text-[2rem]">{p.title}</h1>
            {p.serviceIds.length > 0 && <p className="mt-2 text-[0.9375rem] text-[#141922]/65">{p.serviceIds.map(serviceTypeName).join(" · ")}</p>}
            <dl className="mt-6 grid gap-6 text-[0.9375rem] sm:grid-cols-2">
              <div>
                <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Preparada para</dt>
                <dd className="mt-1.5 leading-relaxed">
                  {client ? (
                    <>
                      <span className="block font-semibold">{client.name}</span>
                      {client.company && <span className="block">{client.company}</span>}
                      {(client.email || client.phone) && <span className="block text-[#141922]/65">{[client.email, client.phone].filter(Boolean).join(" · ")}</span>}
                    </>
                  ) : (
                    <span className="text-[#141922]/55">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Preparada por</dt>
                <dd className="mt-1.5 leading-relaxed">
                  <span className="block font-semibold">{company.founderName}</span>
                  <span className="block">
                    {company.founderRole.pt} · {company.brandName}
                  </span>
                  <span className="block text-[#141922]/65">
                    {phone} · {company.email}
                  </span>
                </dd>
              </div>
              {(p.period || p.location) && (
                <>
                  {p.period && (
                    <div>
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Período</dt>
                      <dd className="mt-1.5">{p.period}</dd>
                    </div>
                  )}
                  {p.location && (
                    <div>
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Local</dt>
                      <dd className="mt-1.5">{p.location}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </section>

          {p.summary && (
            <section className="mt-8">
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Escopo</h2>
              <p className="mt-2 max-w-[70ch] text-[0.9375rem] leading-relaxed">{p.summary}</p>
            </section>
          )}

          {/* Itens */}
          <section className="mt-8">
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Investimento</h2>
            <table className="mt-3 w-full border-collapse text-[0.9375rem]">
              <thead>
                <tr className="border-b border-[#141922]/25 text-left text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#141922]/55">
                  <th className="py-2 pr-3 font-semibold">Descrição</th>
                  <th className="num w-24 py-2 pr-3 text-right font-semibold">Qtd.</th>
                  <th className="num w-28 py-2 pr-3 text-right font-semibold">Unitário</th>
                  <th className="num w-28 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {p.items.map((i) => (
                  <tr key={i.id} className="border-b border-[#141922]/10 align-top">
                    <td className="py-3 pr-3">
                      <span className="block font-medium">{i.description}</span>
                      {i.detail && <span className="block text-[0.8125rem] text-[#141922]/60">{i.detail}</span>}
                    </td>
                    <td className="num whitespace-nowrap py-3 pr-3 text-right">
                      {i.qty} <span className="text-[#141922]/55">{i.unit}</span>
                    </td>
                    <td className="num py-3 pr-3 text-right">{brl.format(i.unitPrice)}</td>
                    <td className="num py-3 text-right font-medium">{brl.format(itemTotal(i))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {totals.discount > 0 && (
                  <>
                    <tr className="text-[#141922]/65">
                      <td colSpan={3} className="num pr-4 pt-3 text-right">
                        Subtotal
                      </td>
                      <td className="num pt-3 text-right">{brl.format(totals.subtotal)}</td>
                    </tr>
                    <tr className="text-[#141922]/65">
                      <td colSpan={3} className="num pr-4 pt-1 text-right">
                        Desconto
                      </td>
                      <td className="num pt-1 text-right">− {brl.format(totals.discount)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td colSpan={3} className="pr-4 pt-4 text-right text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#141922]/55">
                    Total
                  </td>
                  <td className="num pt-3 text-right text-[1.375rem] font-semibold tracking-[-0.02em]">{brl.format(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Condições */}
          <section className="mt-8 grid gap-8 text-[0.875rem] leading-relaxed sm:grid-cols-[1fr_1.4fr]">
            {p.paymentTerms && (
              <div>
                <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Pagamento</h2>
                <p className="mt-2">{p.paymentTerms}</p>
              </div>
            )}
            {terms.length > 0 && (
              <div>
                <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Condições gerais</h2>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[#141922]/80">
                  {terms.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          {/* Aceite */}
          <section className="mt-10 grid gap-10 border-t border-[#141922]/15 pt-8 text-[0.8125rem] sm:grid-cols-2">
            <div>
              <div className="h-10 border-b border-[#141922]/40" />
              <p className="mt-2 font-medium">{company.founderName}</p>
              <p className="text-[#141922]/60">
                {company.brandName} · {company.legalName}
              </p>
            </div>
            <div>
              <div className="h-10 border-b border-[#141922]/40" />
              <p className="mt-2 font-medium">{client?.name ?? "Cliente"}</p>
              <p className="text-[#141922]/60">De acordo · data: ____ / ____ / ________</p>
            </div>
          </section>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-[#141922]/15 pt-4 text-[0.75rem] text-[#141922]/55">
            <span>
              {company.brandName} · {company.city} · {company.tagline}
            </span>
            <span>
              WhatsApp {phone} · @{company.instagram}
            </span>
          </footer>
        </div>
      </article>
      <p className="mx-auto mt-6 max-w-[210mm] text-center text-xs text-muted print:hidden">
        Gerado em {formatDateLong(new Date().toISOString())}. Na janela de impressão, escolha “Salvar como PDF” e desative cabeçalhos e rodapés.
      </p>
    </Shell>
  );
}

// Fundo cinza neutro (como um visualizador de PDF); some na impressão
function Shell({ children, toolbar }: { children: React.ReactNode; toolbar?: React.ReactNode }) {
  return (
    <div className="doc-page min-h-dvh bg-[#e9ebee] print:bg-white">
      {toolbar && (
        <div className="sticky top-0 z-10 border-b border-line bg-ink/90 backdrop-blur-[16px] print:hidden">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 md:px-8">{toolbar}</div>
        </div>
      )}
      <div className="px-4 py-8 md:px-8 md:py-12 print:p-0">{children}</div>
    </div>
  );
}
