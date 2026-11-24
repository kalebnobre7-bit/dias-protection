"use client";

import { AgentCard, DocBrandHeader, DocLabel, DocSheet, VehicleCard, type DocAgent, type DocVehicle } from "@/components/admin/doc";
import { brl, formatPhone } from "@/lib/admin/labels";
import { DOC_LABELS, docDate, docPeriod, docServices, docText, type DocLang } from "@/lib/admin/proposal-i18n";
import { itemTotal, proposalTotals } from "@/lib/admin/proposals";
import type { Client, Proposal, Settings } from "@/lib/admin/types";

export type DocClient = Pick<Client, "name" | "company" | "email" | "phone" | "representatives">;
export type DocCompany = Settings["company"] & { brandName: string; tagline: string };

// Data local de São Paulo ("YYYY-MM-DD") de um timestamptz
const localDay = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

// Linha de assinatura com o nome digitado em caligrafia
function Signature({ name }: { name: string }) {
  return (
    <div className="flex min-h-14 items-end border-b border-[#141922]/40 pb-1">
      <span className="font-[family-name:var(--font-signature)] text-[2.5rem] leading-[1.3] text-[#141922]/85">{name}</span>
    </div>
  );
}

// Folha A4 da proposta, usada no painel (/admin/propostas/documento) e no link do cliente (/proposta).
// categories: categoria de cada item (id → categoria) vinda da planilha; null = proposta sem planilha.
// acceptance: substitui a assinatura do cliente (o formulário de aceite no link).
export function ProposalDocument({
  p,
  categories,
  client,
  team,
  fleet,
  company,
  lang,
  closed,
  acceptance,
}: {
  p: Proposal;
  categories: Record<string, string> | null;
  client: DocClient | null;
  team: DocAgent[];
  fleet: DocVehicle[];
  company: DocCompany;
  lang: DocLang;
  closed: boolean;
  acceptance?: React.ReactNode;
}) {
  const t = DOC_LABELS[lang];
  const kind = closed ? t.confirmed : t.commercial;
  const totals = proposalTotals(p);
  // Itens da planilha agrupados por categoria (Transporte, Proteção…) com total de cada uma
  const categoryOf = (itemId: string) => categories?.[itemId] ?? "Outros";
  const groups = p.items.reduce<{ category: string; items: typeof p.items }[]>((acc, i) => {
    const cat = categoryOf(i.id);
    const group = acc.find((g) => g.category === cat);
    if (group) group.items.push(i);
    else acc.push({ category: cat, items: [i] });
    return acc;
  }, []);
  const grouped = categories !== null && groups.length > 1;
  const terms = p.terms
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const paymentTerms = p.paymentTerms
    .split("\n")
    .map((line) => docText(line.trim(), lang, p.en))
    .join("\n");
  const plural = (n: number, [one, many]: readonly [string, string]) => `${n} ${n === 1 ? one : many}`;
  const crew = [team.length ? plural(team.length, t.agent) : "", fleet.length ? plural(fleet.length, t.vehicle) : ""]
    .filter(Boolean)
    .join(" · ");
  const services = docServices(p, lang);
  const highlights = ([
    // Com descrição, o serviço ganha um bloco inteiro acima da grade
    [t.service, p.summary ? "" : services],
    [t.period, docText(docPeriod(p, lang), lang, p.en)],
    [t.location, docText(p.location, lang, p.en)],
    [t.team, crew],
  ] as const).filter(([, value]) => value);
  const phone = company.whatsapp && `+${company.whatsapp.slice(0, 2)} ${company.whatsapp.slice(2, 4)} ${company.whatsapp.slice(4, -4)}-${company.whatsapp.slice(-4)}`;

  return (
    <DocSheet>
      {/* Cabeçalho: marca + número */}
      <DocBrandHeader kind={kind}>
        <p className="mt-2 text-[0.8125rem] text-[#141922]/65">
          {t.issuedOn} {docDate(p.issuedAt, lang)}
          {!closed && ` · ${t.validUntil} ${docDate(p.validUntil, lang)}`}
        </p>
      </DocBrandHeader>

      {/* Título + partes */}
      <section className="mt-8">
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] md:text-[2rem]">{docText(p.title, lang, p.en)}</h1>

        {p.summary && (
          <div className="mt-6 rounded-lg bg-[#141922]/[0.05] px-4 py-3">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">{t.service}</p>
            {services && <p className="mt-1 text-[0.9375rem] font-semibold leading-snug">{services}</p>}
            <p className="mt-1.5 whitespace-pre-line text-[0.9375rem] leading-relaxed">{docText(p.summary, lang, p.en)}</p>
          </div>
        )}

        {/* Resumo em blocos: o essencial da proposta numa linha */}
        <dl className={`${p.summary ? "mt-2" : "mt-6"} grid grid-cols-2 gap-2 sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none`}>
          {highlights.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-[#141922]/[0.05] px-4 py-3">
              <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">{label}</dt>
              <dd className="mt-1 text-[0.9375rem] font-semibold leading-snug">{value}</dd>
            </div>
          ))}
          <div className="rounded-lg bg-[#141922] px-4 py-3 text-white">
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white/60">{t.total}</dt>
            <dd className="num mt-1 text-[1.125rem] font-semibold leading-snug tracking-[-0.01em]">{brl.format(totals.total)}</dd>
          </div>
        </dl>

        <dl className="mt-6 grid gap-6 text-[0.9375rem] sm:grid-cols-2">
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">{t.preparedFor}</dt>
            <dd className="mt-1.5 leading-relaxed">
              {client ? (
                <>
                  <span className="block text-[1.5rem] font-semibold leading-snug">{client.name}</span>
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
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">{t.preparedBy}</dt>
            <dd className="mt-1.5 leading-relaxed">
              <span className="block text-[1.125rem] font-semibold">{company.founderName}</span>
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

      {team.length > 0 && (
        <section className="mt-8">
          <DocLabel>{t.assignedTeam}</DocLabel>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {team.map((a) => (
              <AgentCard key={a.id} agent={a} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {fleet.length > 0 && (
        <section className="mt-8">
          <DocLabel>{t.vehicles}</DocLabel>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fleet.map((v) => (
              <VehicleCard key={v.id} vehicle={v} showPlate={closed} lang={lang} album />
            ))}
          </div>
        </section>
      )}

      {/* Itens */}
      <section className="mt-8">
        <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">{t.investment}</h2>
        <table className="mt-3 w-full border-collapse text-[0.9375rem]">
          <thead>
            <tr className="border-b border-[#141922]/25 text-left text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#141922]/55">
              <th className="py-2 pr-3 font-semibold">{t.description}</th>
              <th className="num w-24 py-2 pr-3 text-right font-semibold">{t.qty}</th>
              <th className="num w-28 py-2 pr-3 text-right font-semibold">{t.unitPrice}</th>
              <th className="num w-28 py-2 text-right font-semibold">{t.total}</th>
            </tr>
          </thead>
          {(grouped ? groups : [{ category: "", items: p.items }]).map((g) => (
            <tbody key={g.category || "all"}>
              {grouped && (
                <tr>
                  <td colSpan={4} className="pb-1 pt-4 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#141922]/55">
                    {docText(g.category, lang)}
                  </td>
                </tr>
              )}
              {g.items.map((i) => (
                <tr key={i.id} className="border-b border-[#141922]/10 align-top">
                  <td className="py-3 pr-3">
                    <span className="block font-medium">{docText(i.description, lang, p.en)}</span>
                    {i.detail && <span className="block text-[0.8125rem] text-[#141922]/60">{docText(i.detail, lang, p.en)}</span>}
                  </td>
                  <td className="num whitespace-nowrap py-3 pr-3 text-right">
                    {i.qty} <span className="text-[#141922]/55">{docText(i.unit, lang)}{lang === "en" && i.qty !== 1 ? "s" : ""}</span>
                  </td>
                  <td className="num py-3 pr-3 text-right">{brl.format(i.unitPrice)}</td>
                  <td className="num py-3 text-right font-medium">{brl.format(itemTotal(i))}</td>
                </tr>
              ))}
              {grouped && (
                <tr className="border-b border-[#141922]/25">
                  <td colSpan={3} className="num py-2.5 pr-3 text-right text-[0.8125rem] text-[#141922]/65">
                    {t.total} {docText(g.category, lang).toLowerCase()}
                  </td>
                  <td className="num py-2.5 text-right font-semibold">{brl.format(g.items.reduce((sum, i) => sum + itemTotal(i), 0))}</td>
                </tr>
              )}
            </tbody>
          ))}
          <tfoot>
            {totals.discount > 0 && (
              <>
                <tr className="text-[#141922]/65">
                  <td colSpan={3} className="num pr-4 pt-3 text-right">
                    {t.subtotal}
                  </td>
                  <td className="num pt-3 text-right">{brl.format(totals.subtotal)}</td>
                </tr>
                <tr className="text-[#141922]/65">
                  <td colSpan={3} className="num pr-4 pt-1 text-right">
                    {t.discount}
                  </td>
                  <td className="num pt-1 text-right">− {brl.format(totals.discount)}</td>
                </tr>
              </>
            )}
            <tr>
              <td colSpan={3} className="pr-4 pt-4 text-right text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#141922]/55">
                {t.total}
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
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">{t.payment}</h2>
            <p className="whitespace-pre-line font-medium">{paymentTerms}</p>
          </div>
        )}
        {terms.length > 0 && (
          <div>
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55">{t.terms}</h2>
            <ol className="mt-2 list-decimal gap-x-10 pl-5 text-[0.75rem] text-[#141922]/75 sm:columns-2">
              {terms.map((line, i) => (
                <li key={i} className="mb-1 break-inside-avoid">
                  {docText(line, lang, p.en)}
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
        {acceptance ?? (
          <div>
            {/* Aceita pelo link: o nome digitado pelo cliente vira a assinatura */}
            <Signature name={p.acceptedName || client?.name || ""} />
            <p className="mt-2 font-medium">{p.acceptedName || client?.name || t.client}</p>
            <p className="text-[#141922]/60">{p.acceptedAt ? `${t.acceptedOnline} ${docDate(localDay(p.acceptedAt), lang)}` : `${t.agreed}: ____ / ____ / ________`}</p>
          </div>
        )}
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
  );
}
