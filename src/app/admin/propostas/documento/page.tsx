"use client";

import { ArrowLeft as IconBack, Printer as IconPrint } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AgentCard, AgentCv, DocBrandHeader, DocLabel, DocSheet, DocShell as Shell, VehicleCard } from "@/components/admin/doc";
import { localContent } from "@/data/content";
import { useSession } from "@/lib/admin/auth";
import { serviceTypeName } from "@/lib/admin/catalog";
import { brl, formatDate, formatDateLong, formatPhone, proposalStatusLabel } from "@/lib/admin/labels";
import { itemTotal, proposalTotals, scopeSummary } from "@/lib/admin/proposals";
import { useSettings } from "@/lib/admin/settings";
import { useTable } from "@/lib/admin/store";

// Linha de assinatura com o nome digitado em caligrafia
function Signature({ name }: { name: string }) {
  return (
    <div className="flex min-h-14 items-end border-b border-[#141922]/40 pb-1">
      <span className="font-[family-name:var(--font-signature)] text-[2.5rem] leading-[1.3] text-[#141922]/85">{name}</span>
    </div>
  );
}

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
  const kind = closed ? "Serviço confirmado" : "Proposta comercial";
  // Marca fixa do site; contato e assinatura vêm de Configurações
  const company = { ...settings.company, brandName: localContent.company.brandName, tagline: localContent.company.tagline };
  const totals = proposalTotals(p);
  const terms = p.terms
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const crew = [team.length ? plural(team.length, "agente", "agentes") : "", fleet.length ? plural(fleet.length, "veículo", "veículos") : ""]
    .filter(Boolean)
    .join(" · ");
  const highlights = ([
    ["Serviço", scopeSummary(p)],
    ["Período", p.period],
    ["Local", p.location],
    ["Equipe", crew],
  ] as const).filter(([, value]) => value);
  const phone = company.whatsapp && `+${company.whatsapp.slice(0, 2)} ${company.whatsapp.slice(2, 4)} ${company.whatsapp.slice(4, -4)}-${company.whatsapp.slice(-4)}`;

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
        {/* Cabeçalho: marca + número */}
        <DocBrandHeader kind={kind}>
          <p className="mt-2 text-[0.8125rem] text-[#141922]/65">
            Emitida em {formatDate(p.issuedAt)}
            {!closed && ` · válida até ${formatDate(p.validUntil)}`}
          </p>
        </DocBrandHeader>

        {/* Título + partes */}
        <section className="mt-8">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] md:text-[2rem]">{p.title}</h1>
          {p.serviceIds.length > 0 && <p className="mt-2 text-[0.9375rem] text-[#141922]/65">{p.serviceIds.map(serviceTypeName).join(" · ")}</p>}

          {/* Resumo em blocos: o essencial da proposta numa linha */}
          <dl className="mt-6 grid grid-cols-2 gap-2 sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none">
            {highlights.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[#141922]/[0.05] px-4 py-3">
                <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">{label}</dt>
                <dd className="mt-1 text-[0.9375rem] font-semibold leading-snug">{value}</dd>
              </div>
            ))}
            <div className="rounded-lg bg-[#141922] px-4 py-3 text-white">
              <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white/60">Total</dt>
              <dd className="num mt-1 text-[1.125rem] font-semibold leading-snug tracking-[-0.01em]">{brl.format(totals.total)}</dd>
            </div>
          </dl>

          <dl className="mt-6 grid gap-6 text-[0.9375rem] sm:grid-cols-2">
            <div>
              <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Preparada para</dt>
              <dd className="mt-1.5 leading-relaxed">
                {client ? (
                  <>
                    <span className="block font-semibold">{client.name}</span>
                    {client.company && <span className="block">{client.company}</span>}
                    {(client.email || client.phone) && <span className="block text-[#141922]/65">{[client.email, formatPhone(client.phone)].filter(Boolean).join(" · ")}</span>}
                    {client.representatives.map((r) => (
                      <span key={r.id} className="mt-1 block text-[#141922]/65">
                        <span className="text-[#141922]">{r.name}</span>
                        {[r.role, r.contact].filter(Boolean).map((x) => ` · ${x}`)}
                      </span>
                    ))}
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
                  {[company.founderRole, company.brandName].filter(Boolean).join(" · ")}
                </span>
                <span className="block text-[#141922]/65">
                  {[phone, company.email].filter(Boolean).join(" · ")}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        {p.summary && (
          <section className="mt-8">
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Escopo</h2>
            <p className="mt-2 max-w-[70ch] text-[0.9375rem] leading-relaxed">{p.summary}</p>
          </section>
        )}

        {team.length > 0 && (
          <section className="mt-8">
            <DocLabel>Equipe designada</DocLabel>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {team.map((a) => (
                <AgentCard key={a.id} agent={a} />
              ))}
            </div>
          </section>
        )}

        {fleet.length > 0 && (
          <section className="mt-8">
            <DocLabel>Veículos</DocLabel>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {fleet.map((v) => (
                <VehicleCard key={v.id} vehicle={v} showPlate={closed} />
              ))}
            </div>
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
                <td className="pt-3 text-right">
                  <span className="num inline-block whitespace-nowrap rounded-lg bg-[#141922] px-4 py-2 text-[1.375rem] font-semibold tracking-[-0.02em] text-white">
                    {brl.format(totals.total)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Condições */}
        <section className="mt-8 space-y-5 leading-relaxed">
          {p.paymentTerms && (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg bg-[#141922]/[0.05] px-4 py-3 text-[0.875rem]">
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Pagamento</h2>
              <p className="whitespace-pre-line font-medium">{p.paymentTerms}</p>
            </div>
          )}
          {terms.length > 0 && (
            <div>
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">Condições gerais</h2>
              <ol className="mt-2 list-decimal gap-x-10 pl-5 text-[0.75rem] text-[#141922]/75 sm:columns-2">
                {terms.map((t, i) => (
                  <li key={i} className="mb-1 break-inside-avoid">
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        {/* Aceite */}
        <section className="mt-10 grid gap-10 border-t border-[#141922]/15 pt-8 text-[0.8125rem] sm:grid-cols-2">
          <div>
            <Signature name={company.founderName} />
            <p className="mt-2 font-medium">{company.founderName}</p>
            <p className="text-[#141922]/60">
              {[company.brandName, company.legalName].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div>
            <Signature name={client?.name ?? ""} />
            <p className="mt-2 font-medium">{client?.name ?? "Cliente"}</p>
            <p className="text-[#141922]/60">De acordo · data: ____ / ____ / ________</p>
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-[#141922]/15 pt-4 text-[0.75rem] text-[#141922]/55">
          <span>
            {[company.brandName, company.city, company.tagline].filter(Boolean).join(" · ")}
          </span>
          <span>
            {[phone && `WhatsApp ${phone}`, company.instagram && `@${company.instagram}`].filter(Boolean).join(" · ")}
          </span>
        </footer>
      </DocSheet>

      {/* Serviço fechado: um currículo completo por agente, cada um em página própria */}
      {closed &&
        team.map((a) => (
          <DocSheet key={a.id} className="mt-8 print:mt-0 print:break-before-page">
            <DocBrandHeader kind="Equipe designada" />
            <div className="mt-8">
              <AgentCv agent={a} withPrivate />
            </div>
          </DocSheet>
        ))}
      <p className="mx-auto mt-6 max-w-[210mm] text-center text-xs text-muted print:hidden">
        Gerado em {formatDateLong(new Date().toISOString())}. Na janela de impressão, escolha “Salvar como PDF” e desative cabeçalhos e rodapés.
      </p>
    </Shell>
  );
}
