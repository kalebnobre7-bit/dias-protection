"use client";

import { useState } from "react";
import { Plus as IconPlus, Tags as IconTags } from "lucide-react";

import { DateTile, MoneyInput } from "@/components/admin/job-bits";
import { MonthStats } from "@/components/admin/MonthStats";
import { cell, Badge, Button, DeleteButton, EmptyState, Field, List, PageHeader, PeriodStepper, Row, Section, Select, Segmented, Sheet, Skeleton, Stat, statStrip, Switch, useForm } from "@/components/admin/ui";
import { serviceTypeName } from "@/lib/admin/catalog";
import { categoryTotals, countsAsRevenue, currentMonth, jobCostTotal, monthlySummary, monthOf, serviceTotals, shiftMonth, type CategoryTotal } from "@/lib/admin/finance";
import { brl, formatDateTime, formatMonth } from "@/lib/admin/labels";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { FinanceCategory, Job, JobCost, Transaction } from "@/lib/admin/types";

type View = "month" | "service";
type Range = "month" | "year";

const KIND_LABEL: Record<FinanceCategory["kind"], string> = { expense: "Saída", income: "Entrada", both: "Ambos" };

export default function FinancePage() {
  const { rows: jobs, loading: jobsLoading } = useTable("jobs");
  const { rows: costs, loading: costsLoading } = useTable("jobCosts");
  const { rows: clients } = useTable("clients");
  const { rows: transactions, loading: txLoading } = useTable("transactions");
  const loading = jobsLoading || costsLoading || txLoading;
  const { rows: categories } = useTable("financeCategories");
  const [month, setMonth] = useState(currentMonth);
  const [view, setView] = useState<View>("month");
  const [range, setRange] = useState<Range>("month");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [managing, setManaging] = useState(false);

  // Na visão por serviço dá para ver o ano inteiro; as setas pulam de 12 em 12
  const yearly = view === "service" && range === "year";
  const summary = monthlySummary(month, jobs, costs, transactions);
  const byCategory = categoryTotals(month, jobs, costs, transactions);
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
          <PeriodStepper
            label={yearly ? month.slice(0, 4) : formatMonth(month)}
            onStep={(d) => setMonth(shiftMonth(month, yearly ? d * 12 : d))}
            onToday={(yearly ? month.slice(0, 4) !== currentMonth().slice(0, 4) : month !== currentMonth()) ? () => setMonth(currentMonth()) : undefined}
            prevLabel={yearly ? "Ano anterior" : "Mês anterior"}
            nextLabel={yearly ? "Próximo ano" : "Próximo mês"}
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
          ]}
        />
        {view === "service" && (
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "month", label: "No mês" },
              { value: "year", label: "No ano" },
            ]}
          />
        )}
      </div>

      {loading ? (
        <Skeleton stats={view === "service" ? 2 : 4} rows={4} />
      ) : view === "service" ? (
        <ServiceView period={yearly ? month.slice(0, 4) : month} jobs={jobs} costs={costs} />
      ) : (
        <>
          <MonthStats summary={summary} />
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
              <List>
                {monthJobs.map((j) => {
                  const c = jobCostTotal(j.id, costs);
                  return (
                    <Row
                      key={j.id}
                      href={`/admin/servicos?id=${j.id}`}
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
              <div className="flex gap-1">
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
              <p className="px-1 text-sm text-muted">Custos fixos (seguro, equipamento, contador) e entradas fora de serviço.</p>
            )}
          </Section>
        </>
      )}

      {editing && <TransactionSheet tx={editing} isNew={!transactions.some((t) => t.id === editing.id)} categories={categories} onClose={() => setEditing(null)} />}
      {managing && <CategoriesSheet categories={categories} transactions={transactions} onClose={() => setManaging(false)} />}
    </>
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

// Receita, custos e margem agrupados por tipo de serviço, no mês ou no ano
function ServiceView({ period, jobs, costs }: { period: string; jobs: Job[]; costs: JobCost[] }) {
  const rows = serviceTotals(period, jobs, costs);
  const sum = rows.reduce((s, r) => ({ count: s.count + r.count, revenue: s.revenue + r.revenue, margin: s.margin + r.margin }), { count: 0, revenue: 0, margin: 0 });
  const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");

  return (
    <>
      <div className={statStrip[2]}>
        <Stat label="Receita" value={brl.format(sum.revenue)} />
        <Stat label="Margem" value={brl.format(sum.margin)} tone={sum.margin < 0 ? "bad" : "good"} />
      </div>
      <p className="mt-3 px-1 text-[0.8125rem] text-muted">
        {sum.count} serviço(s) agendados e concluídos, menos os custos lançados em cada um. Lançamentos avulsos ficam de fora.
      </p>

      <Section title="Por tipo de serviço" className="mt-10">
        {rows.length ? (
          <List>
            {rows.map((r) => (
              <Row
                key={r.serviceTypeId ?? "none"}
                title={r.serviceTypeId ? serviceTypeName(r.serviceTypeId) : "Sem tipo definido"}
                subtitle={`${r.count} serviço(s) · receita ${brl.format(r.revenue)} · custos ${brl.format(r.costs)}`}
                trailing={
                  <span className="flex flex-col items-end gap-1">
                    <span className={`num font-medium ${r.margin < 0 ? "text-danger" : ""}`}>{brl.format(r.margin)}</span>
                    <Badge tone={r.margin < 0 ? "bad" : "neutral"}>margem {pct(r.margin, r.revenue)}</Badge>
                  </span>
                }
              />
            ))}
          </List>
        ) : (
          <EmptyState title={period.length === 4 ? "Nenhum serviço neste ano" : "Nenhum serviço neste mês"} />
        )}
      </Section>
    </>
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
