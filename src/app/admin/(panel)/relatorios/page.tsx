"use client";

import { useState } from "react";
import { ChevronLeft as IconChevronLeft, ChevronRight as IconChevron } from "lucide-react";

import { EmptyState, PageHeader, Section, Segmented } from "@/components/admin/ui";
import { serviceTypeName } from "@/lib/admin/catalog";
import { countsAsRevenue, currentMonth, jobCostTotal, monthlySummary, shiftMonth } from "@/lib/admin/finance";
import { brl, costCategoryLabel, formatMonth } from "@/lib/admin/labels";
import { useTable } from "@/lib/admin/store";
import type { Job, JobCost } from "@/lib/admin/types";

type View = "service" | "client" | "category" | "monthly";
type Scope = "month" | "year";
type Line = { key: string; label: string; count: number; revenue: number; costs: number };

// Agrupa serviços (agendados e concluídos) somando receita e custos
function groupJobs(jobs: Job[], costs: JobCost[], keyOf: (j: Job) => string, labelOf: (key: string) => string): Line[] {
  const map = new Map<string, Line>();
  for (const j of jobs) {
    const key = keyOf(j);
    const line = map.get(key) ?? { key, label: labelOf(key), count: 0, revenue: 0, costs: 0 };
    line.count += 1;
    line.revenue += j.price;
    line.costs += jobCostTotal(j.id, costs);
    map.set(key, line);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

function sumBy<T>(items: T[], keyOf: (i: T) => string, amountOf: (i: T) => number): { label: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const i of items) map.set(keyOf(i), (map.get(keyOf(i)) ?? 0) + amountOf(i));
  return [...map.entries()].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount);
}

export default function ReportsPage() {
  const { rows: jobs } = useTable("jobs");
  const { rows: costs } = useTable("jobCosts");
  const { rows: clients } = useTable("clients");
  const { rows: transactions } = useTable("transactions");
  const [view, setView] = useState<View>("service");
  const [scope, setScope] = useState<Scope>("month");
  const [month, setMonth] = useState(currentMonth);

  // Visão mensal é sempre do ano inteiro
  const effectiveScope: Scope = view === "monthly" ? "year" : scope;
  const year = month.slice(0, 4);
  const prefix = effectiveScope === "month" ? month : year;
  const inPeriod = (date: string) => date.startsWith(prefix);

  const periodJobs = jobs.filter((j) => countsAsRevenue(j) && inPeriod(j.startsAt));
  const periodJobIds = new Set(periodJobs.map((j) => j.id));
  const periodCosts = costs.filter((c) => periodJobIds.has(c.jobId));
  const periodTx = transactions.filter((t) => inPeriod(t.date));
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Sem cliente";

  const step = (delta: number) => setMonth(shiftMonth(month, effectiveScope === "month" ? delta : delta * 12));

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Receita, custos e margem por serviço, cliente, categoria ou mês."
        action={
          <div className="flex items-center gap-1 rounded-full border border-line p-1">
            <button type="button" onClick={() => step(-1)} aria-label="Período anterior" className="grid size-9 place-items-center rounded-full hover:bg-white/6">
              <IconChevronLeft className="size-4" />
            </button>
            <span className="min-w-36 text-center text-[0.9375rem] font-medium">{effectiveScope === "month" ? formatMonth(month) : `Ano de ${year}`}</span>
            <button type="button" onClick={() => step(1)} aria-label="Próximo período" className="grid size-9 place-items-center rounded-full hover:bg-white/6">
              <IconChevron className="size-4" />
            </button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "service", label: "Por serviço" },
            { value: "client", label: "Por cliente" },
            { value: "category", label: "Por categoria" },
            { value: "monthly", label: "Mensal" },
          ]}
        />
        {view !== "monthly" && (
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { value: "month", label: "Mês" },
              { value: "year", label: "Ano" },
            ]}
          />
        )}
      </div>

      {view === "service" && <JobsTable lines={groupJobs(periodJobs, periodCosts, (j) => j.serviceTypeId ?? "", (k) => serviceTypeName(k || null))} first="Serviço" />}
      {view === "client" && <JobsTable lines={groupJobs(periodJobs, periodCosts, (j) => j.clientId ?? "", (k) => clientName(k))} first="Cliente" />}

      {view === "category" && (
        <div className="grid gap-10 lg:grid-cols-2">
          <AmountTable
            title="Entradas"
            rows={[
              ...(periodJobs.length ? [{ label: "Serviços prestados", amount: periodJobs.reduce((s, j) => s + j.price, 0) }] : []),
              ...sumBy(periodTx.filter((t) => t.kind === "income"), (t) => t.category || "Sem categoria", (t) => t.amount),
            ]}
          />
          <AmountTable
            title="Saídas"
            rows={[
              ...sumBy(periodCosts, (c) => `${costCategoryLabel[c.category]} (custo de serviço)`, (c) => c.amount),
              ...sumBy(periodTx.filter((t) => t.kind === "expense"), (t) => t.category || "Sem categoria", (t) => t.amount),
            ].sort((a, b) => b.amount - a.amount)}
          />
        </div>
      )}

      {view === "monthly" && (
        <Table
          head={["Mês", "Receita", "Custos", "Avulsos", "Resultado"]}
          rows={Array.from({ length: 12 }, (_, i) => {
            const m = `${year}-${String(i + 1).padStart(2, "0")}`;
            const s = monthlySummary(m, jobs, costs, transactions);
            return [formatMonth(m), brl.format(s.revenue), brl.format(s.jobCosts), brl.format(s.otherIncome - s.otherExpense), brl.format(s.profit)];
          })}
          foot={(() => {
            const all = Array.from({ length: 12 }, (_, i) => monthlySummary(`${year}-${String(i + 1).padStart(2, "0")}`, jobs, costs, transactions));
            const total = (f: (s: (typeof all)[number]) => number) => brl.format(all.reduce((acc, s) => acc + f(s), 0));
            return ["Total", total((s) => s.revenue), total((s) => s.jobCosts), total((s) => s.otherIncome - s.otherExpense), total((s) => s.profit)];
          })()}
        />
      )}

      <p className="mt-4 px-1 text-[0.8125rem] text-muted">Considera serviços agendados e concluídos. Orçamentos e cancelados ficam de fora.</p>
    </>
  );
}

function JobsTable({ lines, first }: { lines: Line[]; first: string }) {
  if (!lines.length) return <EmptyState title="Nenhum serviço no período" text="Troque o período ou registre serviços em Serviços." />;
  const total = lines.reduce((t, l) => ({ count: t.count + l.count, revenue: t.revenue + l.revenue, costs: t.costs + l.costs }), { count: 0, revenue: 0, costs: 0 });
  return (
    <Table
      head={[first, "Serviços", "Receita", "Custos", "Margem"]}
      rows={lines.map((l) => [l.label, String(l.count), brl.format(l.revenue), brl.format(l.costs), brl.format(l.revenue - l.costs)])}
      foot={["Total", String(total.count), brl.format(total.revenue), brl.format(total.costs), brl.format(total.revenue - total.costs)]}
    />
  );
}

function AmountTable({ title, rows }: { title: string; rows: { label: string; amount: number }[] }) {
  return (
    <Section title={title}>
      {rows.length ? (
        <Table
          head={["Categoria", "Valor"]}
          rows={rows.map((r) => [r.label, brl.format(r.amount)])}
          foot={["Total", brl.format(rows.reduce((s, r) => s + r.amount, 0))]}
        />
      ) : (
        <p className="px-1 text-[0.9375rem] text-muted">Nada no período.</p>
      )}
    </Section>
  );
}

// Primeira coluna é o rótulo; as demais, valores alinhados à direita
function Table({ head, rows, foot }: { head: string[]; rows: string[][]; foot: string[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-navy/60">
      <table className="w-full min-w-[34rem] border-collapse text-[0.9375rem]">
        <thead>
          <tr className="border-b border-line text-[0.8125rem] text-muted">
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-3 font-medium ${i ? "text-right" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, i) => (
                <td key={i} className={`px-4 py-3 ${i ? "num text-right" : "font-medium"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line-strong font-semibold">
            {foot.map((c, i) => (
              <td key={i} className={`px-4 py-3 ${i ? "num text-right" : ""}`}>
                {c}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
