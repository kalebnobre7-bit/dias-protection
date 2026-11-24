"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus as IconPlus, Repeat as IconFixed, Tags as IconTags, X as IconClose } from "lucide-react";

import { DataTable } from "@/components/admin/DataTable";
import { DateTile, MoneyInput } from "@/components/admin/job-bits";
import { MonthStats, type MonthDetail } from "@/components/admin/MonthStats";
import { cell, Badge, Button, DeleteButton, EmptyState, Field, List, PageHeader, PeriodStepper, Row, Section, Select, Segmented, Sheet, Skeleton, Stat, statStrip, Switch, TextArea, useForm } from "@/components/admin/ui";
import { jobServiceNames, serviceTypeName } from "@/lib/admin/catalog";
import { cashBalance, cashMonth, categoryByClient, categoryTotals, countsAsRevenue, currentMonth, jobCostTotal, jobResults, monthlySummary, monthOf, periodMonths, serviceTotals, shiftMonth, type CategoryTotal, type JobResult, type MonthSummary } from "@/lib/admin/finance";
import { brl, clientLine, costCategoryName, formatDate, formatDateTime, formatMonth, jobDatesText, jobDayCount, percent } from "@/lib/admin/labels";
import { useSettings } from "@/lib/admin/settings";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { FinanceCategory, FixedCost, Job, JobCost, Settings, Transaction } from "@/lib/admin/types";

type View = "month" | "service" | "cash" | "dre";
type Range = "month" | "semester" | "year";

// Valores sem centavos nas tabelas largas (caixa e DRE)
const brl0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const monthName = (m: string, style: "long" | "short") => {
  const label = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1).toLocaleDateString("pt-BR", { month: style }).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const KIND_LABEL: Record<FinanceCategory["kind"], string> = { expense: "Saída", income: "Entrada", both: "Ambos" };

export default function FinancePage() {
  const { rows: jobs, loading: jobsLoading } = useTable("jobs");
  const { rows: costs, loading: costsLoading } = useTable("jobCosts");
  const { rows: clients } = useTable("clients");
  const { rows: transactions, loading: txLoading } = useTable("transactions");
  const { settings, loading: settingsLoading } = useSettings();
  const loading = jobsLoading || costsLoading || txLoading || settingsLoading;
  const { rows: categories } = useTable("financeCategories");
  const [month, setMonth] = useState(currentMonth);
  const [view, setView] = useState<View>("month");
  const [range, setRange] = useState<Range>("month");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [managing, setManaging] = useState(false);
  const [detail, setDetail] = useState<MonthDetail | null>(null);
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [cashOpen, setCashOpen] = useState(false);
  const [fixedOpen, setFixedOpen] = useState(false);
  const [noteMonth, setNoteMonth] = useState<string | null>(null);

  // Por serviço: mês, semestre ou ano. Caixa e DRE: sempre o ano. As setas pulam o período inteiro
  const span: Range = view === "cash" || view === "dre" ? "year" : view === "service" ? range : "month";
  const months = periodMonths(month, span);
  const stepSize = span === "year" ? 12 : span === "semester" ? 6 : 1;
  const year = month.slice(0, 4);
  const periodLabel = span === "year" ? year : span === "semester" ? `${Number(month.slice(5, 7)) <= 6 ? 1 : 2}º semestre ${year}` : formatMonth(month);
  const fixedMonthly = settings.costs.fixed.reduce((s, f) => s + f.amount, 0);
  const summary = monthlySummary(month, jobs, costs, transactions);
  const byCategory = categoryTotals(month, jobs, costs, transactions);
  const monthJobs = jobs.filter((j) => countsAsRevenue(j) && monthOf(j.startsAt) === month).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const monthTx = transactions.filter((t) => monthOf(t.date) === month).sort((a, b) => a.date.localeCompare(b.date));
  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.name ?? "Sem cliente";
  const clientOf = (j: Job) => clientLine(clients.find((c) => c.id === j.clientId));
  const matrix = categoryByClient(month, jobs, costs);
  const cash = cashBalance(settings.finance.cashOpening, settings.finance.cashDate, jobs, costs, transactions);
  const openJob = jobs.find((j) => j.id === openJobId);
  const openResult = openJob && jobResults([monthOf(openJob.startsAt)], jobs, costs, fixedMonthly).find((r) => r.job.id === openJob.id);

  const blank = (m = month): Transaction => ({
    id: newId(),
    kind: "expense",
    description: "",
    category: "",
    amount: 0,
    date: m === currentMonth() ? new Date().toISOString().slice(0, 10) : `${m}-01`,
    paid: true,
    createdAt: new Date().toISOString(),
  });

  return (
    <>
      <PageHeader
        title="Financeiro"
        subtitle="Receita dos serviços, custos e lançamentos avulsos do mês."
        action={
          <PeriodStepper
            label={periodLabel}
            onStep={(d) => setMonth(shiftMonth(month, d * stepSize))}
            onToday={!periodMonths(currentMonth(), span).includes(month) ? () => setMonth(currentMonth()) : undefined}
            prevLabel={span === "year" ? "Ano anterior" : span === "semester" ? "Semestre anterior" : "Mês anterior"}
            nextLabel={span === "year" ? "Próximo ano" : span === "semester" ? "Próximo semestre" : "Próximo mês"}
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "month", label: "Mês" },
            { value: "service", label: "Por serviço" },
            { value: "cash", label: "Caixa" },
            { value: "dre", label: "DRE" },
          ]}
        />
        {view === "service" && (
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "month", label: "No mês" },
              { value: "semester", label: "No semestre" },
              { value: "year", label: "No ano" },
            ]}
          />
        )}
      </div>

      {loading ? (
        <Skeleton stats={4} rows={4} />
      ) : view === "service" ? (
        <ServiceView months={months} single={span === "month"} jobs={jobs} costs={costs} fixedMonthly={fixedMonthly} clientOf={clientOf} onJob={setOpenJobId} />
      ) : view === "cash" ? (
        <>
          <CashFlowView months={months} cash={cash} settings={settings} jobs={jobs} costs={costs} transactions={transactions} />
          <MonthNotes months={months} settings={settings} transactions={transactions} onOpen={setNoteMonth} />
        </>
      ) : view === "dre" ? (
        <>
          <DreView months={months} jobs={jobs} costs={costs} transactions={transactions} />
          <MonthNotes months={months} settings={settings} transactions={transactions} onOpen={setNoteMonth} />
        </>
      ) : (
        <>
          <div className={`${statStrip[2]} mb-4`}>
            <Stat label="Capital em caixa" value={brl.format(cash)} tone={cash < 0 ? "bad" : "default"} onClick={() => setCashOpen(true)} />
            <Stat label={`Imposto (${percent.format(summary.taxRate)})`} value={brl.format(summary.tax)} tone="muted" />
          </div>
          <MonthStats summary={summary} onOpen={setDetail} />
          <p className="mt-3 px-1 text-[0.8125rem] text-muted">
            Receita e custos consideram serviços agendados e concluídos do mês. Orçamentos e cancelados ficam de fora.
          </p>

          {(byCategory.expense.length > 0 || summary.otherIncome > 0) && (
            <Section title="Por categoria" className="mt-10">
              <div className="grid gap-3 md:grid-cols-2">
                <CategoryBars title="Saídas" rows={byCategory.expense} tone="expense" />
                <CategoryBars title="Entradas" rows={byCategory.income} tone="income" />
              </div>
            </Section>
          )}

          <Section title="Serviços do mês" className="mt-10">
            {monthJobs.length ? (
              <List striped>
                {monthJobs.map((j) => {
                  const profit = j.price - jobCostTotal(j.id, costs) - j.price * summary.taxRate;
                  return (
                    <Row
                      key={j.id}
                      onClick={() => setOpenJobId(j.id)}
                      leading={<DateTile value={j.startsAt} />}
                      title={clientOf(j)}
                      subtitle={`${jobServiceNames(j)} · ${jobDatesText(j)}`}
                      trailing={
                        <span className="flex flex-col items-end gap-1">
                          <span className="flex gap-4 sm:gap-8">
                            <span className="flex flex-col items-end">
                              <span className="text-[0.75rem] text-muted">Total a receber</span>
                              <span className="num font-medium">{brl.format(j.price)}</span>
                            </span>
                            <span className="flex flex-col items-end">
                              <span className="text-[0.75rem] text-muted">Lucro</span>
                              <span className={`num font-medium ${profit < 0 ? "text-danger" : ""}`}>{brl.format(profit)}</span>
                            </span>
                          </span>
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

          {matrix.rows.length > 0 && (
            <Section title="Custos por categoria e cliente" className="mt-10">
              <DataTable
                striped
                head={["Categoria", ...matrix.clients.map(clientName), "Total", "%"]}
                rows={matrix.rows.map((r) => [r.category, ...matrix.clients.map((id) => (r.byClient[id] ? brl.format(r.byClient[id]) : "—")), brl.format(r.total), percent.format(r.share)])}
                foot={["Total", ...matrix.clients.map((id) => brl.format(matrix.rows.reduce((s, r) => s + (r.byClient[id] ?? 0), 0))), brl.format(matrix.total), percent.format(1)]}
              />
            </Section>
          )}

          <Section
            title="Lançamentos avulsos"
            className="mt-10"
            action={
              <div className="flex gap-1">
                <Button variant="ghost" className="!min-h-9 !px-3" onClick={() => setFixedOpen(true)}>
                  <IconFixed className="size-4" /> <span className="max-sm:sr-only">Custos fixos</span>
                </Button>
                <Button variant="ghost" className="!min-h-9 !px-3" onClick={() => setManaging(true)}>
                  <IconTags className="size-4" /> <span className="max-sm:sr-only">Categorias</span>
                </Button>
                <Button variant="ghost" className="!min-h-9 !px-3" onClick={() => setEditing(blank())}>
                  <IconPlus className="size-4" /> Novo lançamento
                </Button>
              </div>
            }
          >
            {monthTx.length ? (
              <List striped>
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
              <p className="px-1 text-sm text-muted">Custos fixos (seguro, equipamento, contador) e entradas fora de serviço.</p>
            )}
          </Section>
        </>
      )}

      {editing && <TransactionSheet tx={editing} isNew={!transactions.some((t) => t.id === editing.id)} categories={categories} onClose={() => setEditing(null)} />}
      {managing && <CategoriesSheet categories={categories} transactions={transactions} onClose={() => setManaging(false)} />}
      {detail && (
        <MonthDetailSheet
          kind={detail}
          month={month}
          summary={summary}
          jobs={monthJobs}
          costs={costs}
          transactions={monthTx}
          clientOf={clientOf}
          onClose={() => setDetail(null)}
          onJob={(id) => {
            setDetail(null);
            setOpenJobId(id);
          }}
        />
      )}
      {openJob && openResult && <JobSummarySheet job={openJob} title={clientOf(openJob)} costs={costs} result={openResult} onClose={() => setOpenJobId(null)} />}
      {noteMonth && (
        <MonthNoteSheet
          month={noteMonth}
          settings={settings}
          transactions={transactions.filter((t) => monthOf(t.date) === noteMonth).sort((a, b) => a.date.localeCompare(b.date))}
          onClose={() => setNoteMonth(null)}
          onEdit={(t) => {
            setNoteMonth(null);
            setEditing(t ?? blank(noteMonth));
          }}
        />
      )}
      {cashOpen && <CashSheet settings={settings} onClose={() => setCashOpen(false)} />}
      {fixedOpen && <FixedCostsSheet settings={settings} month={month} transactions={transactions} categories={categories} onClose={() => setFixedOpen(false)} />}
    </>
  );
}

const DETAIL_TITLE: Record<MonthDetail, string> = { revenue: "Receita bruta", receivable: "A receber", costs: "Custos", profit: "Lucro líquido" };

function MoneyLines({ rows }: { rows: { label: string; value: string; strong?: boolean }[] }) {
  return (
    <dl className="divide-y divide-line border-y border-line text-sm [&>div:nth-child(even)]:bg-white/[0.035]">
      {rows.map((r) => (
        <div key={r.label} className={`flex items-baseline justify-between gap-4 px-1 py-2.5 ${r.strong ? "text-base font-semibold" : ""}`}>
          <dt className={r.strong ? "" : "text-muted"}>{r.label}</dt>
          <dd className="num text-right">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// O que compõe cada card do mês; clicar num serviço abre a tabelinha dele
function MonthDetailSheet(props: {
  kind: MonthDetail;
  month: string;
  summary: MonthSummary;
  jobs: Job[];
  costs: JobCost[];
  transactions: Transaction[];
  clientOf: (j: Job) => string;
  onJob: (id: string) => void;
  onClose: () => void;
}) {
  const { kind, summary, jobs, costs, transactions } = props;
  const money = (v: number) => <span className="num font-medium">{brl.format(v)}</span>;
  const jobRow = (j: Job, value: number) => (
    <Row key={j.id} onClick={() => props.onJob(j.id)} title={props.clientOf(j)} subtitle={`${jobServiceNames(j)} · ${jobDatesText(j)}`} trailing={money(value)} />
  );
  const txRow = (t: Transaction) => <Row key={t.id} title={t.description} subtitle={[formatDate(t.date), t.category].filter(Boolean).join(" · ")} trailing={money(t.amount)} />;
  const txOf = (k: Transaction["kind"]) => transactions.filter((t) => t.kind === k).map(txRow);

  const rows = {
    revenue: () => [...jobs.map((j) => jobRow(j, j.price)), ...txOf("income")],
    receivable: () => jobs.filter((j) => j.paymentStatus === "pending").map((j) => jobRow(j, j.price)),
    costs: () => [
      ...jobs.flatMap((j) =>
        costs
          .filter((c) => c.jobId === j.id && c.amount)
          .map((c) => (
            <Row
              key={c.id}
              onClick={() => props.onJob(j.id)}
              title={props.clientOf(j)}
              subtitle={[costCategoryName(c.category), c.description, jobServiceNames(j)].filter(Boolean).join(" · ")}
              trailing={money(c.amount)}
            />
          )),
      ),
      ...txOf("expense"),
    ],
    profit: () => jobs.map((j) => jobRow(j, j.price - jobCostTotal(j.id, costs) - j.price * summary.taxRate)),
  }[kind]();

  const total = { revenue: summary.revenue + summary.otherIncome, receivable: summary.receivable, costs: summary.jobCosts + summary.otherExpense, profit: summary.profit }[kind];

  return (
    <Sheet open onClose={props.onClose} title={`${DETAIL_TITLE[kind]} · ${formatMonth(props.month)}`}>
      <MoneyLines
        rows={[
          ...(kind === "profit"
            ? [
                { label: "Receita de serviços", value: brl.format(summary.revenue) },
                { label: "Entradas avulsas", value: brl.format(summary.otherIncome) },
                { label: "Custos dos serviços", value: `− ${brl.format(summary.jobCosts)}` },
                { label: "Saídas avulsas", value: `− ${brl.format(summary.otherExpense)}` },
                { label: `Imposto (${percent.format(summary.taxRate)})`, value: `− ${brl.format(summary.tax)}` },
              ]
            : []),
          { label: kind === "profit" ? "Lucro líquido" : "Total", value: brl.format(total), strong: true },
        ]}
      />
      {rows.length ? <List striped>{rows}</List> : <p className="px-1 text-sm text-muted">Nada neste mês.</p>}
    </Sheet>
  );
}

// Tabelinha de um serviço: datas, receita, custos por categoria, imposto e lucro
function JobSummarySheet({ job: j, title, costs, result, onClose }: { job: Job; title: string; costs: JobCost[]; result: JobResult; onClose: () => void }) {
  const lines = costs.filter((c) => c.jobId === j.id && c.amount);
  const totalCosts = lines.reduce((s, c) => s + c.amount, 0);
  const { tax, overhead } = result;
  const taxRate = j.price ? tax / j.price : 0;
  const byCategory = new Map<string, number>();
  for (const c of lines) byCategory.set(costCategoryName(c.category), (byCategory.get(costCategoryName(c.category)) ?? 0) + c.amount);

  return (
    <Sheet
      open
      onClose={onClose}
      title={title}
      footer={
        <Link href={`/admin/servicos?id=${j.id}`} className="ml-auto inline-flex min-h-11 items-center rounded-full border border-line-strong px-4 text-[0.9375rem] hover:border-silver">
          Editar serviço
        </Link>
      }
    >
      <MoneyLines
        rows={[
          { label: "Serviço", value: jobServiceNames(j) },
          { label: "Datas", value: jobDatesText(j) },
          { label: "Dias", value: String(jobDayCount(j)) },
          { label: "Receita", value: brl.format(j.price) },
          ...[...byCategory].map(([label, value]) => ({ label: `Custo · ${label}`, value: brl.format(value) })),
          { label: "Total de custos", value: brl.format(totalCosts) },
          { label: `Imposto (${percent.format(taxRate)})`, value: brl.format(tax) },
          { label: "Lucro", value: brl.format(j.price - totalCosts - tax), strong: !overhead },
          ...(overhead
            ? [
                { label: "Rateio dos custos fixos", value: `− ${brl.format(overhead)}` },
                { label: "Lucro líquido", value: brl.format(result.net), strong: true },
              ]
            : []),
        ]}
      />
      <Section title="Entradas e saídas">
        <List striped>
          <Row
            title="Receita do serviço"
            trailing={
              <span className="flex flex-col items-end gap-1">
                <span className="num font-medium text-[#8fd6a5]">+ {brl.format(j.price)}</span>
                <Badge tone={j.paymentStatus === "paid" ? "good" : "warn"}>{j.paymentStatus === "paid" ? "Recebido" : "A receber"}</Badge>
              </span>
            }
          />
          {lines.map((c) => (
            <Row
              key={c.id}
              title={c.description || costCategoryName(c.category)}
              subtitle={costCategoryName(c.category)}
              trailing={
                <span className="flex flex-col items-end gap-1">
                  <span className="num font-medium">− {brl.format(c.amount)}</span>
                  <Badge tone={c.paid ? "good" : "warn"}>{c.paid ? "Pago" : c.advance ? `Adiantado ${brl.format(c.advance)}` : "A pagar"}</Badge>
                </span>
              }
            />
          ))}
        </List>
      </Section>
    </Sheet>
  );
}

// Saldo informado à mão; depois dessa data o que for marcado como pago atualiza o caixa
function CashSheet({ settings, onClose }: { settings: Settings; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const { value, set, dirty } = useForm({ ...settings.finance, cashDate: settings.finance.cashDate || today });
  const [error, setError] = useState("");
  const save = async () => {
    try {
      await repo.upsert("settings", { ...settings, finance: value });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };
  return (
    <Sheet
      open
      error={error}
      dirty={dirty}
      onClose={onClose}
      title="Capital em caixa"
      footer={
        <Button className="ml-auto" onClick={save}>
          Salvar
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Saldo em caixa">
          <MoneyInput value={value.cashOpening} onChange={(v) => set("cashOpening", v)} />
        </Field>
        <Field label="Data do saldo">
          <input className="input" type="date" value={value.cashDate} onChange={(e) => set("cashDate", e.target.value)} />
        </Field>
      </div>
      <p className="px-1 text-[0.875rem] text-muted">A partir dessa data, o que for marcado como recebido ou pago atualiza o capital em caixa.</p>
    </Sheet>
  );
}

// Cadastro dos custos que se repetem; os botões lançam no mês aberto, ou dele até dezembro, o que ainda não foi lançado
function FixedCostsSheet(props: { settings: Settings; month: string; transactions: Transaction[]; categories: FinanceCategory[]; onClose: () => void }) {
  const { value, set, dirty } = useForm({ fixed: props.settings.costs.fixed });
  const [error, setError] = useState("");
  const update = (id: string, patch: Partial<FixedCost>) => set("fixed", value.fixed.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const valid = value.fixed.filter((f) => f.description.trim() && f.amount > 0).map((f) => ({ ...f, description: f.description.trim() }));
  const pendingIn = (month: string) => {
    const monthTx = props.transactions.filter((t) => monthOf(t.date) === month && t.kind === "expense");
    return valid.filter((f) => !monthTx.some((t) => t.description === f.description && t.category === f.category));
  };
  const pending = pendingIn(props.month);
  // Do mês aberto até dezembro do mesmo ano
  const monthsLeft = Array.from({ length: 13 - Number(props.month.slice(5)) }, (_, i) => shiftMonth(props.month, i));
  const pendingLeft = monthsLeft.reduce((n, month) => n + pendingIn(month).length, 0);
  const options = props.categories.filter((c) => c.kind !== "income").map((c) => c.name).sort((a, b) => a.localeCompare(b));

  const finish = async (months: string[]) => {
    try {
      await repo.upsert("settings", { ...props.settings, costs: { ...props.settings.costs, fixed: valid } });
      for (const month of months)
        for (const f of pendingIn(month))
          await repo.upsert("transactions", { id: newId(), kind: "expense", description: f.description, category: f.category, amount: f.amount, date: `${month}-01`, paid: false, createdAt: new Date().toISOString() });
      props.onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };

  return (
    <Sheet
      open
      error={error}
      dirty={dirty}
      onClose={props.onClose}
      title="Custos fixos"
      footer={
        <>
          <span className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={!pending.length} onClick={() => finish([props.month])}>
              Lançar em {formatMonth(props.month)}
              {pending.length ? ` (${pending.length})` : ""}
            </Button>
            {monthsLeft.length > 1 && (
              <Button variant="secondary" disabled={!pendingLeft} onClick={() => finish(monthsLeft)}>
                Lançar até dezembro
                {pendingLeft ? ` (${pendingLeft})` : ""}
              </Button>
            )}
          </span>
          <Button className="ml-auto" onClick={() => finish([])}>
            Salvar
          </Button>
        </>
      }
    >
      <p className="text-[0.875rem] text-muted">Valem para todos os meses. Ao lançar, entram como “A pagar” em Lançamentos avulsos; o que já foi lançado em cada mês não repete.</p>
      {value.fixed.length > 0 && (
        <div className="divide-y divide-line">
          {value.fixed.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center gap-1 py-1.5 sm:flex-nowrap">
              <input className={`input ${cell} min-w-0 basis-full sm:basis-auto sm:flex-1`} value={f.description} onChange={(e) => update(f.id, { description: e.target.value })} placeholder="Descrição" aria-label="Descrição" />
              <Select className={`${cell} !w-auto`} value={f.category} aria-label="Categoria" onChange={(e) => update(f.id, { category: e.target.value })}>
                <option value="">Sem categoria</option>
                {[...new Set([...options, ...(f.category ? [f.category] : [])])].map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
              <MoneyInput value={f.amount} onChange={(v) => update(f.id, { amount: v })} label="Valor" className="!w-32" />
              <button
                type="button"
                onClick={() => set("fixed", value.fixed.filter((x) => x.id !== f.id))}
                aria-label="Remover custo fixo"
                className="ml-auto grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-white/6 hover:text-danger"
              >
                <IconClose className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Button variant="ghost" onClick={() => set("fixed", [...value.fixed, { id: newId(), description: "", category: "", amount: 0 }])}>
        <IconPlus className="size-4" /> Adicionar custo fixo
      </Button>
    </Sheet>
  );
}

// Barras horizontais por categoria, proporcionais à maior
function CategoryBars({ title, rows, tone }: { title: string; rows: CategoryTotal[]; tone: "expense" | "income" }) {
  const max = Math.max(...rows.map((r) => r.amount), 1);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="px-1">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="text-[0.875rem] text-muted">{title}</p>
        <p className="num text-sm font-semibold">{brl.format(total)}</p>
      </div>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-3 text-[0.875rem]">
                <span className="truncate">{r.label}</span>
                <span className="num shrink-0 text-silver">
                  {brl.format(r.amount)} <span className="text-muted">· {Math.round((r.amount / total) * 100)}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/6">
                <div className={`h-full rounded-full ${tone === "income" ? "bg-[#8fd6a5]/70" : "bg-accent/70"}`} style={{ width: `${(r.amount / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[0.875rem] text-muted">Nada no mês.</p>
      )}
    </div>
  );
}

// Receita, custos, margem e lucro líquido (com rateio dos custos fixos) por tipo e por serviço
function ServiceView(props: { months: string[]; single: boolean; jobs: Job[]; costs: JobCost[]; fixedMonthly: number; clientOf: (j: Job) => string; onJob: (id: string) => void }) {
  const results = jobResults(props.months, props.jobs, props.costs, props.fixedMonthly);
  const rows = serviceTotals(results);
  const sum = rows.reduce((s, r) => ({ count: s.count + r.count, revenue: s.revenue + r.revenue, margin: s.margin + r.margin, net: s.net + r.net }), { count: 0, revenue: 0, margin: 0, net: 0 });
  const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");

  return (
    <>
      <div className={statStrip[4]}>
        <Stat label="Receita" value={brl.format(sum.revenue)} tone="good" />
        <Stat label="Margem" value={brl.format(sum.margin)} tone={sum.margin < 0 ? "bad" : "default"} />
        <Stat label="Lucro líquido" value={brl.format(sum.net)} tone={sum.net < 0 ? "bad" : "default"} />
        <Stat label="Margem líquida" value={pct(sum.net, sum.revenue)} tone="muted" />
      </div>
      <p className="mt-3 px-1 text-[0.8125rem] text-muted">
        {sum.count} serviço(s) agendados e concluídos. Margem = receita − custos do serviço. Lucro líquido tira também o imposto e o rateio dos custos fixos
        {props.fixedMonthly ? ` (${brl.format(props.fixedMonthly)}/mês, divididos entre os serviços de cada mês pelo valor)` : " (nenhum custo fixo cadastrado)"}.
      </p>

      <Section title="Por tipo de serviço" className="mt-10">
        {rows.length ? (
          <List striped>
            {rows.map((r) => (
              <Row
                key={r.serviceTypeId ?? "none"}
                title={r.serviceTypeId ? serviceTypeName(r.serviceTypeId) : "Sem tipo definido"}
                subtitle={`${r.count} serviço(s) · receita ${brl.format(r.revenue)} · custos ${brl.format(r.costs)} · margem ${brl.format(r.margin)}`}
                trailing={
                  <span className="flex flex-col items-end gap-1">
                    <span className={`num font-medium ${r.net < 0 ? "text-danger" : ""}`}>{brl.format(r.net)}</span>
                    <Badge tone={r.net < 0 ? "bad" : "neutral"}>líquida {pct(r.net, r.revenue)}</Badge>
                  </span>
                }
              />
            ))}
          </List>
        ) : (
          <EmptyState title={props.single ? "Nenhum serviço neste mês" : "Nenhum serviço no período"} />
        )}
      </Section>

      {results.length > 0 && (
        <Section title="Serviço a serviço" className="mt-10">
          <List striped>
            {results.map((r) => (
              <Row
                key={r.job.id}
                onClick={() => props.onJob(r.job.id)}
                leading={<DateTile value={r.job.startsAt} />}
                title={props.clientOf(r.job)}
                subtitle={`${jobServiceNames(r.job)} · ${jobDatesText(r.job)}`}
                trailing={
                  <span className="flex gap-4 sm:gap-8">
                    <span className="flex flex-col items-end">
                      <span className="text-[0.75rem] text-muted">Receita</span>
                      <span className="num font-medium">{brl.format(r.job.price)}</span>
                    </span>
                    <span className="flex flex-col items-end">
                      <span className="text-[0.75rem] text-muted">Líquido</span>
                      <span className={`num font-medium ${r.net < 0 ? "text-danger" : ""}`}>{brl.format(r.net)}</span>
                    </span>
                  </span>
                }
              />
            ))}
          </List>
        </Section>
      )}
    </>
  );
}

// Regime de caixa, mês a mês: o que entrou e saiu de fato, o saldo acumulado e o que ficou pendente
function CashFlowView(props: { months: string[]; cash: number; settings: Settings; jobs: Job[]; costs: JobCost[]; transactions: Transaction[] }) {
  const { cashOpening, cashDate } = props.settings.finance;
  const lines = props.months.map((m) => {
    const c = cashMonth(m, props.jobs, props.costs, props.transactions);
    // Antes da data do saldo informado não dá para saber o caixa
    const end = cashDate && `${m}-31` < cashDate ? null : cashBalance(cashOpening, cashDate, props.jobs, props.costs, props.transactions, `${m}-31`);
    return { m, ...c, end };
  });
  const total = (k: "inflow" | "outflow" | "receivable" | "payable") => lines.reduce((s, l) => s + l[k], 0);
  const lastEnd = lines.at(-1)?.end ?? null;

  return (
    <>
      <div className={statStrip[4]}>
        <Stat label="Capital em caixa" value={brl.format(props.cash)} tone={props.cash < 0 ? "bad" : "default"} />
        <Stat label="Entradas no ano" value={brl.format(total("inflow"))} tone="good" />
        <Stat label="Saídas no ano" value={brl.format(total("outflow"))} />
        <Stat label="Saldo do ano" value={brl.format(total("inflow") - total("outflow"))} tone={total("inflow") < total("outflow") ? "bad" : "default"} />
      </div>
      <p className="mt-3 mb-6 px-1 text-[0.8125rem] text-muted">
        Só o que foi marcado como recebido ou pago, no mês em que aconteceu. Caixa no fim parte do saldo informado em Capital em caixa (aba Mês).
      </p>
      <DataTable
        striped
        head={["Mês", "Entradas", "Saídas", "Saldo do mês", "Caixa no fim", "A receber", "A pagar"]}
        rows={lines.map((l) => [
          monthName(l.m, "long"),
          brl0.format(l.inflow),
          brl0.format(l.outflow),
          brl0.format(l.inflow - l.outflow),
          l.end === null ? "—" : brl0.format(l.end),
          l.receivable ? brl0.format(l.receivable) : "—",
          l.payable ? brl0.format(l.payable) : "—",
        ])}
        foot={["Total", brl0.format(total("inflow")), brl0.format(total("outflow")), brl0.format(total("inflow") - total("outflow")), lastEnd === null ? "—" : brl0.format(lastEnd), brl0.format(total("receivable")), brl0.format(total("payable"))]}
      />
    </>
  );
}

// DRE por competência: linhas do demonstrativo, uma coluna por mês e o total do ano
function DreView(props: { months: string[]; jobs: Job[]; costs: JobCost[]; transactions: Transaction[] }) {
  const all = props.months.map((m) => monthlySummary(m, props.jobs, props.costs, props.transactions));
  const lines: [string, (s: MonthSummary) => number][] = [
    ["Receita bruta", (s) => s.revenue],
    ["(−) Impostos", (s) => s.tax],
    ["Receita líquida", (s) => s.revenue - s.tax],
    ["(−) Custos dos serviços", (s) => s.jobCosts],
    ["Lucro bruto", (s) => s.revenue - s.tax - s.jobCosts],
    ["(−) Despesas fixas e avulsas", (s) => s.otherExpense],
    ["(+) Outras receitas", (s) => s.otherIncome],
    ["Lucro líquido", (s) => s.profit],
  ];
  const sum = (f: (s: MonthSummary) => number) => all.reduce((acc, s) => acc + f(s), 0);
  const margin = (profit: number, s: { revenue: number; otherIncome: number }) => {
    const base = s.revenue + s.otherIncome;
    return base > 0 ? percent.format(profit / base) : "—";
  };
  const yearRevenue = sum((s) => s.revenue);
  const yearProfit = sum((s) => s.profit);

  return (
    <>
      <div className={statStrip[4]}>
        <Stat label="Receita bruta" value={brl.format(yearRevenue)} tone="good" />
        <Stat label="Impostos" value={brl.format(sum((s) => s.tax))} tone="muted" />
        <Stat label="Lucro líquido" value={brl.format(yearProfit)} tone={yearProfit < 0 ? "bad" : "default"} />
        <Stat label="Margem líquida" value={margin(yearProfit, { revenue: yearRevenue, otherIncome: sum((s) => s.otherIncome) })} tone="muted" />
      </div>
      <p className="mt-3 mb-6 px-1 text-[0.8125rem] text-muted">Por competência: cada serviço conta no mês em que acontece, recebido ou não. Despesas incluem os custos fixos lançados.</p>
      <DataTable
        striped
        strong={[2, 4, 7]}
        head={["", ...props.months.map((m) => monthName(m, "short")), "Total"]}
        rows={[
          ...lines.map(([label, f]) => [label, ...all.map((s) => brl0.format(f(s))), brl0.format(sum(f))]),
          ["Margem líquida", ...all.map((s) => margin(s.profit, s)), margin(yearProfit, { revenue: yearRevenue, otherIncome: sum((s) => s.otherIncome) })],
        ]}
      />
    </>
  );
}

// Descritivo de cada mês, editável, com a contagem de lançamentos
function MonthNotes(props: { months: string[]; settings: Settings; transactions: Transaction[]; onOpen: (m: string) => void }) {
  return (
    <Section title="Descritivos e movimentações" className="mt-10">
      <List striped>
        {props.months.map((m) => {
          const note = props.settings.finance.notes[m]?.trim();
          const count = props.transactions.filter((t) => monthOf(t.date) === m).length;
          return (
            <Row
              key={m}
              onClick={() => props.onOpen(m)}
              title={monthName(m, "long")}
              subtitle={note ? note.split("\n")[0] : "Sem descritivo"}
              trailing={<span className="num text-xs text-muted">{count} lançamento(s)</span>}
            />
          );
        })}
      </List>
    </Section>
  );
}

// Descritivo do mês + lançamentos dele; tocar num lançamento abre a edição
function MonthNoteSheet(props: { month: string; settings: Settings; transactions: Transaction[]; onEdit: (t: Transaction | null) => void; onClose: () => void }) {
  const [note, setNote] = useState(props.settings.finance.notes[props.month] ?? "");
  const [error, setError] = useState("");
  const dirty = note !== (props.settings.finance.notes[props.month] ?? "");
  const persist = async () => {
    if (!dirty) return true;
    try {
      const notes = { ...props.settings.finance.notes, [props.month]: note.trim() };
      if (!notes[props.month]) delete notes[props.month];
      await repo.upsert("settings", { ...props.settings, finance: { ...props.settings.finance, notes } });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      return false;
    }
  };
  const save = async () => {
    if (await persist()) props.onClose();
  };
  // Abrir um lançamento salva o descritivo antes, para não perder o texto
  const edit = async (t: Transaction | null) => {
    if (await persist()) props.onEdit(t);
  };
  return (
    <Sheet
      open
      error={error}
      dirty={dirty}
      onClose={props.onClose}
      title={formatMonth(props.month)}
      footer={
        <Button className="ml-auto" onClick={save}>
          Salvar
        </Button>
      }
    >
      <Field label="Descritivo do mês" hint="O que aconteceu no mês: eventos, decisões, observações do caixa.">
        <TextArea rows={5} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <Section
        title="Lançamentos do mês"
        action={
          <Button variant="ghost" className="!min-h-9 !px-3" onClick={() => edit(null)}>
            <IconPlus className="size-4" /> Novo lançamento
          </Button>
        }
      >
        {props.transactions.length ? (
          <List striped>
            {props.transactions.map((t) => (
              <Row
                key={t.id}
                onClick={() => edit(t)}
                title={t.description}
                subtitle={[formatDate(t.date), t.category].filter(Boolean).join(" · ")}
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
          <p className="px-1 text-sm text-muted">Nenhum lançamento neste mês.</p>
        )}
      </Section>
    </Sheet>
  );
}

function TransactionSheet(props: { tx: Transaction; isNew: boolean; categories: FinanceCategory[]; onClose: () => void }) {
  const { value: t, set, dirty } = useForm(props.tx);
  const [error, setError] = useState("");
  const [newCat, setNewCat] = useState<string | null>(null);

  // Categorias do tipo escolhido; a atual entra mesmo se tiver sido excluída ou for de outro tipo
  const options = props.categories.filter((c) => c.kind === "both" || c.kind === t.kind).map((c) => c.name).sort((a, b) => a.localeCompare(b));
  if (t.category && !options.includes(t.category)) options.unshift(t.category);

  const createCategory = async () => {
    const name = (newCat ?? "").trim();
    if (!name) return;
    const existing = props.categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    try {
      if (!existing) await repo.upsert("financeCategories", { id: newId(), name, kind: t.kind, createdAt: new Date().toISOString() });
      set("category", existing?.name ?? name);
      setNewCat(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar a categoria.");
    }
  };

  const save = async () => {
    if (!t.description.trim()) return setError("Informe a descrição.");
    if (!(t.amount > 0)) return setError("Informe o valor.");
    if (!t.date) return setError("Informe a data.");
    try {
      await repo.upsert("transactions", { ...t, description: t.description.trim() });
      props.onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };
  const remove = async () => {
    try {
      await repo.remove("transactions", t.id);
      props.onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
  };

  return (
    <Sheet
      open
      error={error}
      dirty={dirty}
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
      {newCat === null ? (
        <Field label="Categoria" hint="As categorias se editam em Financeiro → Categorias">
          <Select value={t.category} onChange={(e) => (e.target.value === "__new" ? setNewCat("") : set("category", e.target.value))}>
            <option value="">Sem categoria</option>
            {options.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="__new">+ Nova categoria…</option>
          </Select>
        </Field>
      ) : (
        <Field label="Nova categoria">
          <div className="flex gap-2">
            <input
              className="input"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createCategory()}
              placeholder="Ex.: aluguel, combustível da frota"
              autoFocus
            />
            <Button variant="ghost" onClick={() => setNewCat(null)}>
              Cancelar
            </Button>
            <Button variant="secondary" disabled={!newCat.trim()} onClick={createCategory}>
              Criar
            </Button>
          </div>
        </Field>
      )}
      <div className="px-1">
        <Switch checked={t.paid} onChange={(v) => set("paid", v)} label={t.kind === "income" ? "Recebido" : "Pago"} />
      </div>
    </Sheet>
  );
}

// Criar, renomear, mudar o tipo e excluir categorias. Renomear atualiza os lançamentos que usam o nome antigo.
function CategoriesSheet(props: { categories: FinanceCategory[]; transactions: Transaction[]; onClose: () => void }) {
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ name: "", kind: "expense" as FinanceCategory["kind"] });
  const sorted = [...props.categories].sort((a, b) => a.name.localeCompare(b.name));
  const usage = (name: string) => props.transactions.filter((t) => t.category === name).length;
  const taken = (name: string, id?: string) => props.categories.some((c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase());

  const run = async (fn: () => Promise<void>) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };

  const add = () =>
    run(async () => {
      const name = draft.name.trim();
      if (!name) return;
      if (taken(name)) return setError("Já existe uma categoria com esse nome.");
      await repo.upsert("financeCategories", { id: newId(), name, kind: draft.kind, createdAt: new Date().toISOString() });
      setDraft({ ...draft, name: "" });
    });

  // Nome vazio ou repetido volta ao nome salvo
  const rename = (c: FinanceCategory, input: HTMLInputElement) =>
    run(async () => {
      const name = input.value.trim();
      if (!name || name === c.name || taken(name, c.id)) {
        input.value = c.name;
        if (name && name !== c.name) setError("Já existe uma categoria com esse nome.");
        return;
      }
      await repo.upsert("financeCategories", { ...c, name });
      for (const t of props.transactions.filter((t) => t.category === c.name)) await repo.upsert("transactions", { ...t, category: name });
    });

  return (
    <Sheet
      open
      error={error}
      onClose={props.onClose}
      title="Categorias"
      footer={
        <Button className="ml-auto" onClick={props.onClose}>
          Pronto
        </Button>
      }
    >
      <p className="text-[0.875rem] text-muted">
        Usadas nos lançamentos avulsos. As categorias dos custos de cada serviço ficam em Configurações. Excluir uma categoria não apaga os lançamentos.
      </p>
      <div className="divide-y divide-line">
        {sorted.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-1 py-1.5 sm:flex-nowrap">
            <input
              className={`input ${cell} min-w-0 basis-full sm:basis-auto sm:flex-1`}
              defaultValue={c.name}
              aria-label="Nome da categoria"
              onBlur={(e) => rename(c, e.currentTarget)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
            <Select className={`${cell} !w-auto`} value={c.kind} aria-label="Tipo" onChange={(e) => run(() => repo.upsert("financeCategories", { ...c, kind: e.target.value as FinanceCategory["kind"] }).then(() => undefined))}>
              {Object.entries(KIND_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <span className="num ml-auto shrink-0 text-xs text-muted sm:w-20 sm:text-right">{usage(c.name)} lanç.</span>
            <DeleteButton label="Excluir" onConfirm={() => run(() => repo.remove("financeCategories", c.id))} />
          </div>
        ))}
      </div>
      <Field label="Nova categoria">
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <input className="input min-w-0 basis-full sm:basis-auto sm:flex-1" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Ex.: aluguel" />
          <Select className="!w-auto" value={draft.kind} aria-label="Tipo da nova categoria" onChange={(e) => setDraft({ ...draft, kind: e.target.value as FinanceCategory["kind"] })}>
            {Object.entries(KIND_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button variant="secondary" disabled={!draft.name.trim()} onClick={add}>
            <IconPlus className="size-4" /> Adicionar
          </Button>
        </div>
      </Field>
    </Sheet>
  );
}
