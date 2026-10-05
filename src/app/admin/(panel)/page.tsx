"use client";

import Link from "next/link";
import { Plus as IconPlus, TriangleAlert as IconWarn } from "lucide-react";

import { DateTile, statusTone } from "@/components/admin/job-bits";
import { MonthStats } from "@/components/admin/MonthStats";
import { Badge, EmptyState, List, PageHeader, Row, Section } from "@/components/admin/ui";
import { serviceTypeName } from "@/lib/admin/catalog";
import { currentMonth, monthlySummary } from "@/lib/admin/finance";
import { alertLabel, percent, proposalAlert, proposalFunnel } from "@/lib/admin/funnel";
import { brl, formatDate, formatDateTime, formatMonth, jobStatusLabel, proposalStatusLabel, proposalStatusTone } from "@/lib/admin/labels";
import { proposalTotals } from "@/lib/admin/proposals";
import { useTable } from "@/lib/admin/store";

export default function AdminHome() {
  const { rows: jobs } = useTable("jobs");
  const { rows: costs } = useTable("jobCosts");
  const { rows: clients } = useTable("clients");
  const { rows: transactions } = useTable("transactions");
  const { rows: proposals } = useTable("proposals");

  const month = currentMonth();
  const summary = monthlySummary(month, jobs, costs, transactions);
  const now = new Date().toISOString().slice(0, 16);
  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.name ?? "Sem cliente";

  const upcoming = jobs
    .filter((j) => (j.status === "scheduled" || j.status === "quote") && j.startsAt >= now.slice(0, 10))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 6);
  const openProposals = proposals
    .filter((p) => p.status === "draft" || p.status === "sent")
    .sort((a, b) => a.validUntil.localeCompare(b.validUntil))
    .slice(0, 6);
  const pipeline = proposals.filter((p) => p.status === "sent").reduce((s, p) => s + proposalTotals(p).total, 0);
  const receivable = jobs
    .filter((j) => j.status === "done" && j.paymentStatus === "pending")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  // Propostas vencendo (até 3 dias) ou vencidas sem resposta: a primeira coisa a ver no dia
  const alerts = proposals
    .map((p) => ({ p, alert: proposalAlert(p) }))
    .filter((x): x is { p: (typeof proposals)[number]; alert: NonNullable<ReturnType<typeof proposalAlert>> } => x.alert !== null)
    .sort((a, b) => a.alert.days - b.alert.days);
  const funnel = proposalFunnel(proposals, jobs);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <>
      <PageHeader
        title={`${greeting}, Gabriel`}
        subtitle={formatMonth(month)}
        action={
          <Link
            href="/admin/servicos?novo=1"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-text px-5 text-[0.9375rem] font-medium text-ink transition-[background-color,transform] duration-300 hover:bg-white active:scale-[0.97]"
          >
            <IconPlus className="size-4" /> Novo serviço
          </Link>
        }
      />

      {alerts.length > 0 && (
        <div role="status" className="mb-6 rounded-2xl border border-[#e8c27a]/40 bg-[#e8c27a]/6 p-4">
          <p className="flex items-center gap-2 font-semibold">
            <IconWarn className="size-4 text-[#e8c27a]" />
            {alerts.length === 1 ? "1 proposta precisa de atenção" : `${alerts.length} propostas precisam de atenção`}
          </p>
          <ul className="mt-2 space-y-1 text-[0.9375rem]">
            {alerts.slice(0, 4).map(({ p, alert }) => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-x-2">
                <Link href="/admin/propostas" className="num font-medium text-text hover:underline">
                  {p.number}
                </Link>
                <span className="min-w-0 flex-1 truncate text-muted">
                  {p.title || "Sem título"} · {clientName(p.clientId)}
                </span>
                <Badge tone={alert.kind === "expired" ? "bad" : "warn"}>{alertLabel(alert)}</Badge>
              </li>
            ))}
            {alerts.length > 4 && (
              <li>
                <Link href="/admin/propostas" className="link-chevron text-[0.875rem]">
                  Ver todas
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      <MonthStats summary={summary} />

      {/* Funil comercial: quantas propostas viram serviço */}
      <Section title="Funil comercial" className="mt-8">
        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-line bg-navy/60">
          {[
            { label: "Enviadas", value: funnel.sent, note: funnel.waiting ? `${funnel.waiting} aguardando` : "" },
            { label: "Aceitas", value: funnel.accepted, note: percent(funnel.acceptRate) },
            { label: "Realizadas", value: funnel.done, note: percent(funnel.doneRate) },
          ].map((s, i) => (
            <div key={s.label} className={`min-w-0 p-4 sm:p-5 ${i > 0 ? "border-l border-line" : ""}`}>
              <p className="text-[0.875rem] text-muted">{s.label}</p>
              <p className="num mt-2 text-[clamp(1.25rem,4.4vw,1.75rem)] font-semibold tracking-[-0.02em]">{s.value}</p>
              {s.note && <p className="num mt-0.5 truncate text-[0.8125rem] text-muted">{s.note}</p>}
            </div>
          ))}
        </div>
        <p className="mt-2 px-1 text-[0.8125rem] text-muted">
          Taxas: aceitas sobre enviadas e realizadas sobre aceitas.
          {funnel.acceptedValue > 0 && <> Valor fechado: {brl.format(funnel.acceptedValue)}.</>}
        </p>
      </Section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 [&>*]:min-w-0">
        <Section
          title={pipeline ? `Propostas · ${brl.format(pipeline)} em aberto` : "Propostas em aberto"}
          action={
            <Link href="/admin/propostas" className="link-chevron text-[0.875rem]">
              Ver todas
            </Link>
          }
        >
          {openProposals.length ? (
            <List>
              {openProposals.map((p) => {
                const alert = proposalAlert(p);
                return (
                  <Row
                    key={p.id}
                    leading={
                      <span className="num grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-navy-2 text-xs font-semibold text-silver">
                        {p.number}
                      </span>
                    }
                    title={p.title || "Sem título"}
                    subtitle={`${clientName(p.clientId)} · ${alert ? alertLabel(alert) : `até ${formatDate(p.validUntil)}`}`}
                    trailing={
                      <span className="flex flex-col items-end gap-1">
                        <span className="num font-medium">{brl.format(proposalTotals(p).total)}</span>
                        <Badge tone={alert ? (alert.kind === "expired" ? "bad" : "warn") : proposalStatusTone(p.status)}>
                          {proposalStatusLabel[p.status]}
                        </Badge>
                      </span>
                    }
                  />
                );
              })}
            </List>
          ) : (
            <EmptyState
              title="Nenhuma proposta em aberto"
              text="Monte um orçamento com itens e validade e envie o documento."
              action={
                <Link href="/admin/propostas?nova=1" className="link-chevron text-[0.9375rem]">
                  Nova proposta
                </Link>
              }
            />
          )}
        </Section>

        <Section
          title="Próximos serviços"
          action={
            <Link href="/admin/servicos" className="link-chevron text-[0.875rem]">
              Ver todos
            </Link>
          }
        >
          {upcoming.length ? (
            <List>
              {upcoming.map((j) => (
                <Row
                  key={j.id}
                  leading={<DateTile value={j.startsAt} />}
                  title={clientName(j.clientId)}
                  subtitle={`${serviceTypeName(j.serviceTypeId)} · ${formatDateTime(j.startsAt)}`}
                  trailing={<Badge tone={statusTone(j.status)}>{jobStatusLabel[j.status]}</Badge>}
                />
              ))}
            </List>
          ) : (
            <EmptyState title="Agenda livre" text="Nenhum serviço agendado ou orçamento pendente." />
          )}
        </Section>

        <Section
          title="A receber"
          action={
            <Link href="/admin/financeiro" className="link-chevron text-[0.875rem]">
              Financeiro
            </Link>
          }
        >
          {receivable.length ? (
            <List>
              {receivable.map((j) => (
                <Row
                  key={j.id}
                  leading={<DateTile value={j.startsAt} />}
                  title={clientName(j.clientId)}
                  subtitle={serviceTypeName(j.serviceTypeId)}
                  trailing={<span className="num font-medium">{brl.format(j.price)}</span>}
                />
              ))}
            </List>
          ) : (
            <EmptyState title="Tudo recebido" text="Nenhum serviço concluído com pagamento pendente." />
          )}
        </Section>
      </div>
    </>
  );
}
