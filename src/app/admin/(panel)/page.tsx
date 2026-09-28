"use client";

import Link from "next/link";
import { Plus as IconPlus } from "lucide-react";

import { DateTile, statusTone } from "@/components/admin/job-bits";
import { MonthStats } from "@/components/admin/MonthStats";
import { Badge, EmptyState, List, PageHeader, Row, Section } from "@/components/admin/ui";
import { serviceTypeName } from "@/lib/admin/catalog";
import { currentMonth, monthlySummary } from "@/lib/admin/finance";
import { brl, formatDateTime, formatMonth, jobStatusLabel } from "@/lib/admin/labels";
import { useTable } from "@/lib/admin/store";

export default function AdminHome() {
  const { rows: jobs } = useTable("jobs");
  const { rows: costs } = useTable("jobCosts");
  const { rows: clients } = useTable("clients");
  const { rows: transactions } = useTable("transactions");

  const month = currentMonth();
  const summary = monthlySummary(month, jobs, costs, transactions);
  const now = new Date().toISOString().slice(0, 16);
  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.name ?? "Sem cliente";

  const upcoming = jobs
    .filter((j) => (j.status === "scheduled" || j.status === "quote") && j.startsAt >= now.slice(0, 10))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 6);
  const receivable = jobs
    .filter((j) => j.status === "done" && j.paymentStatus === "pending")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

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

      <MonthStats summary={summary} />

      <div className="mt-10 grid gap-10 lg:grid-cols-2 [&>*]:min-w-0">
        <Section title="Próximos serviços" action={<Link href="/admin/servicos" className="link-chevron text-[0.875rem]">Ver todos</Link>}>
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

        <Section title="A receber" action={<Link href="/admin/financeiro" className="link-chevron text-[0.875rem]">Financeiro</Link>}>
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
