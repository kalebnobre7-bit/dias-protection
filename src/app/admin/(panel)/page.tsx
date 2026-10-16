"use client";

import Link from "next/link";
import { Plus as IconPlus } from "lucide-react";

import { DateTile, NumberTile, statusTone } from "@/components/admin/job-bits";
import { MonthStats } from "@/components/admin/MonthStats";
import { Badge, buttonClass, EmptyState, List, PageHeader, Row, Section, Skeleton } from "@/components/admin/ui";
import { serviceTypeName } from "@/lib/admin/catalog";
import { countsAsRevenue, currentMonth, monthlySummary, monthOf } from "@/lib/admin/finance";
import { brl, formatDate, formatDateTime, formatMonth, jobStatusLabel, proposalStatusLabel, proposalStatusTone } from "@/lib/admin/labels";
import { proposalTotals } from "@/lib/admin/proposals";
import { useTable } from "@/lib/admin/store";

export default function AdminHome() {
  const { rows: jobs, loading: jobsLoading } = useTable("jobs");
  const { rows: costs, loading: costsLoading } = useTable("jobCosts");
  const { rows: clients } = useTable("clients");
  const { rows: transactions, loading: txLoading } = useTable("transactions");
  const { rows: proposals, loading: proposalsLoading } = useTable("proposals");
  const loading = jobsLoading || costsLoading || txLoading || proposalsLoading;

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
  // Mesma regra do card "A receber" (agendados e concluídos não pagos), mais o que ficou pendente de meses anteriores
  const receivableAll = jobs
    .filter((j) => countsAsRevenue(j) && j.paymentStatus === "pending" && monthOf(j.startsAt) <= month)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const receivable = receivableAll.slice(0, 6);
  const receivableTotal = receivableAll.reduce((s, j) => s + j.price, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <>
      <PageHeader
        title={`${greeting}, Gabriel`}
        subtitle={formatMonth(month)}
        action={
          <Link href="/admin/servicos?novo=1" className={buttonClass("primary")}>
            <IconPlus className="size-4" /> Novo serviço
          </Link>
        }
      />

      {loading ? (
        <Skeleton stats={4} rows={4} />
      ) : (
        <>
          <MonthStats summary={summary} />

          <div className="mt-10 grid gap-10 lg:grid-cols-2 [&>*]:min-w-0">
            <Section
              title={pipeline ? `Propostas · ${brl.format(pipeline)} em aberto` : "Propostas em aberto"}
              action={<Link href="/admin/propostas" className="link-chevron text-[0.875rem]">Ver todas</Link>}
            >
              {openProposals.length ? (
                <List>
                  {openProposals.map((p) => (
                    <Row
                      key={p.id}
                      href={`/admin/propostas?id=${p.id}`}
                      leading={<NumberTile number={p.number} />}
                      title={p.title || "Sem título"}
                      subtitle={`${clientName(p.clientId)} · até ${formatDate(p.validUntil)}`}
                      trailing={
                        <span className="flex flex-col items-end gap-1">
                          <span className="num font-medium">{brl.format(proposalTotals(p).total)}</span>
                          <Badge tone={proposalStatusTone(p.status)}>{proposalStatusLabel[p.status]}</Badge>
                        </span>
                      }
                    />
                  ))}
                </List>
              ) : (
                <EmptyState
                  title="Nenhuma proposta em aberto"
                  text="Monte um orçamento com itens e validade e envie o documento."
                  action={<Link href="/admin/propostas?nova=1" className="link-chevron text-[0.9375rem]">Nova proposta</Link>}
                />
              )}
            </Section>

            <Section title="Próximos serviços" action={<Link href="/admin/servicos" className="link-chevron text-[0.875rem]">Ver todos</Link>}>
              {upcoming.length ? (
                <List>
                  {upcoming.map((j) => (
                    <Row
                      key={j.id}
                      href={`/admin/servicos?id=${j.id}`}
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
              title={receivableTotal ? `A receber · ${brl.format(receivableTotal)}` : "A receber"}
              action={<Link href="/admin/financeiro" className="link-chevron text-[0.875rem]">Financeiro</Link>}
            >
              {receivable.length ? (
                <List>
                  {receivable.map((j) => (
                    <Row
                      key={j.id}
                      href={`/admin/servicos?id=${j.id}`}
                      leading={<DateTile value={j.startsAt} />}
                      title={clientName(j.clientId)}
                      subtitle={serviceTypeName(j.serviceTypeId)}
                      trailing={
                        <span className="flex flex-col items-end gap-1">
                          <span className="num font-medium">{brl.format(j.price)}</span>
                          {monthOf(j.startsAt) < month && <Badge tone="bad">Atrasado</Badge>}
                        </span>
                      }
                    />
                  ))}
                </List>
              ) : (
                <EmptyState title="Tudo recebido" text="Nenhum serviço com pagamento pendente." />
              )}
            </Section>
          </div>
        </>
      )}
    </>
  );
}
