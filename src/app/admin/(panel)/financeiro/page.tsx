"use client";

import { useState } from "react";
import { ChevronLeft as IconChevronLeft, ChevronRight as IconChevron, Plus as IconPlus } from "lucide-react";

import { DateTile, MoneyInput } from "@/components/admin/job-bits";
import { MonthStats } from "@/components/admin/MonthStats";
import { Badge, Button, DeleteButton, EmptyState, Field, List, PageHeader, Row, Section, Segmented, Sheet, Switch, useForm } from "@/components/admin/ui";
import { serviceTypeName } from "@/lib/admin/catalog";
import { countsAsRevenue, currentMonth, jobCostTotal, monthlySummary, monthOf, shiftMonth } from "@/lib/admin/finance";
import { brl, formatDateTime, formatMonth } from "@/lib/admin/labels";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { Transaction } from "@/lib/admin/types";

export default function FinancePage() {
  const { rows: jobs } = useTable("jobs");
  const { rows: costs } = useTable("jobCosts");
  const { rows: clients } = useTable("clients");
  const { rows: transactions } = useTable("transactions");
  const [month, setMonth] = useState(currentMonth);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const summary = monthlySummary(month, jobs, costs, transactions);
  const monthJobs = jobs.filter((j) => countsAsRevenue(j) && monthOf(j.startsAt) === month).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const monthTx = transactions.filter((t) => monthOf(t.date) === month).sort((a, b) => a.date.localeCompare(b.date));
  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.name ?? "Sem cliente";

  const blank = (): Transaction => ({
    id: newId(),
    kind: "expense",
    description: "",
    category: "",
    amount: 0,
    date: month === currentMonth() ? new Date().toISOString().slice(0, 10) : `${month}-01`,
    paid: true,
    createdAt: new Date().toISOString(),
  });

  return (
    <>
      <PageHeader
        title="Financeiro"
        subtitle="Receita dos serviços, custos e lançamentos avulsos do mês."
        action={
          <div className="flex items-center gap-1 rounded-full border border-line p-1">
            <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mês anterior" className="grid size-9 place-items-center rounded-full hover:bg-white/6">
              <IconChevronLeft className="size-4" />
            </button>
            <span className="min-w-36 text-center text-[0.9375rem] font-medium">{formatMonth(month)}</span>
            <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Próximo mês" className="grid size-9 place-items-center rounded-full hover:bg-white/6">
              <IconChevron className="size-4" />
            </button>
          </div>
        }
      />

      <MonthStats summary={summary} />
      <p className="mt-3 px-1 text-[0.8125rem] text-muted">
        Receita e custos consideram serviços agendados e concluídos do mês. Orçamentos e cancelados ficam de fora.
      </p>

      <Section title="Serviços do mês" className="mt-10">
        {monthJobs.length ? (
          <List>
            {monthJobs.map((j) => {
              const c = jobCostTotal(j.id, costs);
              return (
                <Row
                  key={j.id}
                  leading={<DateTile value={j.startsAt} />}
                  title={clientName(j.clientId)}
                  subtitle={`${serviceTypeName(j.serviceTypeId)} · custos ${brl.format(c)}`}
                  trailing={
                    <span className="flex flex-col items-end gap-1">
                      <span className="num font-medium">{brl.format(j.price - c)}</span>
                      <Badge tone={j.paymentStatus === "paid" ? "good" : "warn"}>{j.paymentStatus === "paid" ? "Recebido" : "A receber"}</Badge>
                    </span>
                  }
                />
              );
            })}
          </List>
        ) : (
          <EmptyState title="Nenhum serviço neste mês" />
        )}
      </Section>

      <Section
        title="Lançamentos avulsos"
        className="mt-10"
        action={
          <Button variant="ghost" className="!min-h-9 !px-3" onClick={() => setEditing(blank())}>
            <IconPlus className="size-4" /> Novo lançamento
          </Button>
        }
      >
        {monthTx.length ? (
          <List>
            {monthTx.map((t) => (
              <Row
                key={t.id}
                onClick={() => setEditing(t)}
                title={t.description}
                subtitle={[formatDateTime(t.date), t.category].filter(Boolean).join(" · ")}
                trailing={
                  <span className="flex flex-col items-end gap-1">
                    <span className={`num font-medium ${t.kind === "income" ? "text-[#8fd6a5]" : ""}`}>
                      {t.kind === "income" ? "+" : "−"} {brl.format(t.amount)}
                    </span>
                    {!t.paid && <Badge tone="warn">{t.kind === "income" ? "A receber" : "A pagar"}</Badge>}
                  </span>
                }
              />
            ))}
          </List>
        ) : (
          <p className="px-1 text-[0.9375rem] text-muted">Custos fixos (seguro, equipamento, contador) e entradas fora de serviço.</p>
        )}
      </Section>

      {editing && <TransactionSheet tx={editing} isNew={!transactions.some((t) => t.id === editing.id)} onClose={() => setEditing(null)} />}
    </>
  );
}

function TransactionSheet(props: { tx: Transaction; isNew: boolean; onClose: () => void }) {
  const { value: t, set } = useForm(props.tx);
  const [error, setError] = useState("");

  const save = async () => {
    if (!t.description.trim()) return setError("Informe a descrição.");
    if (!(t.amount > 0)) return setError("Informe o valor.");
    if (!t.date) return setError("Informe a data.");
    await repo.upsert("transactions", { ...t, description: t.description.trim() });
    props.onClose();
  };
  const remove = async () => {
    await repo.remove("transactions", t.id);
    props.onClose();
  };

  return (
    <Sheet
      open
      error={error}
      onClose={props.onClose}
      title={props.isNew ? "Novo lançamento" : t.description || "Lançamento"}
      footer={
        <>
          {!props.isNew && <DeleteButton onConfirm={remove} />}
          <Button className="ml-auto" onClick={save}>
            Salvar
          </Button>
        </>
      }
    >
      <Field label="Tipo">
        <Segmented
          value={t.kind}
          onChange={(v) => set("kind", v)}
          options={[
            { value: "expense", label: "Saída" },
            { value: "income", label: "Entrada" },
          ]}
        />
      </Field>
      <Field label="Descrição">
        <input className="input" value={t.description} onChange={(e) => set("description", e.target.value)} autoFocus={props.isNew} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valor">
          <MoneyInput value={t.amount} onChange={(v) => set("amount", v)} />
        </Field>
        <Field label="Data">
          <input className="input" type="date" value={t.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
      </div>
      <Field label="Categoria" hint="Ex.: seguro, equipamento, contador, uniforme">
        <input className="input" value={t.category} onChange={(e) => set("category", e.target.value)} />
      </Field>
      <div className="rounded-2xl border border-line px-4 py-2">
        <Switch checked={t.paid} onChange={(v) => set("paid", v)} label={t.kind === "income" ? "Recebido" : "Pago"} />
      </div>
    </Sheet>
  );
}
