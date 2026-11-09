import { costCategoryName } from "./labels";
import type { Job, JobCost, Transaction } from "./types";

// Mesmo cálculo da view monthly_summary: orçamentos e cancelados não entram na receita
export const countsAsRevenue = (job: Job) => job.status === "scheduled" || job.status === "done";

export const monthOf = (value: string) => value.slice(0, 7); // "YYYY-MM"

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function jobCostTotal(jobId: string, costs: JobCost[]): number {
  return costs.filter((c) => c.jobId === jobId).reduce((sum, c) => sum + c.amount, 0);
}

// Simples Nacional, Anexo III: alíquota nominal e parcela a deduzir por faixa de receita em 12 meses
const ANEXO_III = [
  { limit: 180_000, rate: 0.06, deduction: 0 },
  { limit: 360_000, rate: 0.112, deduction: 9_360 },
  { limit: 720_000, rate: 0.135, deduction: 17_640 },
  { limit: 1_800_000, rate: 0.16, deduction: 35_640 },
  { limit: 3_600_000, rate: 0.21, deduction: 125_640 },
  { limit: Infinity, rate: 0.33, deduction: 648_000 },
];

// Alíquota efetiva = (RBT12 × nominal − parcela a deduzir) ÷ RBT12
export function effectiveTaxRate(rbt12: number): number {
  const band = ANEXO_III.find((b) => rbt12 <= b.limit) ?? ANEXO_III[0];
  return band.deduction === 0 ? band.rate : (rbt12 * band.rate - band.deduction) / rbt12;
}

// RBT12: receita de serviços dos 12 meses anteriores ao mês de apuração
export function rbt12(month: string, jobs: Job[]): number {
  const from = shiftMonth(month, -12);
  return jobs.filter((j) => countsAsRevenue(j) && monthOf(j.startsAt) >= from && monthOf(j.startsAt) < month).reduce((s, j) => s + j.price, 0);
}

export const monthTaxRate = (month: string, jobs: Job[]) => effectiveTaxRate(rbt12(month, jobs));

export type MonthSummary = {
  revenue: number;
  receivable: number;
  jobCosts: number;
  otherIncome: number;
  otherExpense: number;
  taxRate: number;
  tax: number; // imposto sobre a receita de serviços do mês
  profit: number; // lucro líquido, já sem o imposto
};

export function monthlySummary(month: string, jobs: Job[], costs: JobCost[], transactions: Transaction[]): MonthSummary {
  const monthJobs = jobs.filter((j) => countsAsRevenue(j) && monthOf(j.startsAt) === month);
  const revenue = monthJobs.reduce((s, j) => s + j.price, 0);
  const receivable = monthJobs.filter((j) => j.paymentStatus === "pending").reduce((s, j) => s + j.price, 0);
  const jobCosts = monthJobs.reduce((s, j) => s + jobCostTotal(j.id, costs), 0);
  const monthTx = transactions.filter((t) => monthOf(t.date) === month);
  const otherIncome = monthTx.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0);
  const otherExpense = monthTx.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0);
  const taxRate = monthTaxRate(month, jobs);
  const tax = revenue * taxRate;
  return { revenue, receivable, jobCosts, otherIncome, otherExpense, taxRate, tax, profit: revenue + otherIncome - jobCosts - otherExpense - tax };
}

export type CategoryTotal = { label: string; amount: number };

const groupSum = (pairs: [string, number][]): CategoryTotal[] => {
  const map = new Map<string, number>();
  for (const [label, amount] of pairs) map.set(label, (map.get(label) ?? 0) + amount);
  return [...map].map(([label, amount]) => ({ label, amount })).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);
};

// Saídas e entradas do mês por categoria: custos dos serviços + lançamentos avulsos (mesmo nome soma junto)
export function categoryTotals(month: string, jobs: Job[], costs: JobCost[], transactions: Transaction[]): { expense: CategoryTotal[]; income: CategoryTotal[] } {
  const monthJobs = jobs.filter((j) => countsAsRevenue(j) && monthOf(j.startsAt) === month);
  const ids = new Set(monthJobs.map((j) => j.id));
  const monthTx = transactions.filter((t) => monthOf(t.date) === month);
  const txPairs = (kind: Transaction["kind"]) => monthTx.filter((t) => t.kind === kind).map((t): [string, number] => [t.category.trim() || "Sem categoria", t.amount]);
  return {
    expense: groupSum([...costs.filter((c) => ids.has(c.jobId)).map((c): [string, number] => [costCategoryName(c.category), c.amount]), ...txPairs("expense")]),
    income: groupSum([["Serviços", monthJobs.reduce((s, j) => s + j.price, 0)], ...txPairs("income")]),
  };
}

export type ServiceTotal = { serviceTypeId: string | null; count: number; revenue: number; costs: number; margin: number };

// Serviços do período ("YYYY-MM" ou "YYYY") agrupados por tipo, do mais rentável ao menos
export function serviceTotals(period: string, jobs: Job[], costs: JobCost[]): ServiceTotal[] {
  const map = new Map<string | null, ServiceTotal>();
  for (const j of jobs.filter((j) => countsAsRevenue(j) && j.startsAt.startsWith(period))) {
    const row = map.get(j.serviceTypeId) ?? { serviceTypeId: j.serviceTypeId, count: 0, revenue: 0, costs: 0, margin: 0 };
    const c = jobCostTotal(j.id, costs);
    row.count += 1;
    row.revenue += j.price;
    row.costs += c;
    row.margin += j.price - c;
    map.set(j.serviceTypeId, row);
  }
  return [...map.values()].sort((a, b) => b.margin - a.margin);
}

// Caixa: saldo informado + o que entrou menos o que saiu de fato desde a data do saldo
export function cashBalance(opening: number, since: string, jobs: Job[], costs: JobCost[], transactions: Transaction[]): number {
  const after = (date: string) => !since || date >= since;
  const jobsById = new Map(jobs.map((j) => [j.id, j]));
  const received = jobs.filter((j) => countsAsRevenue(j) && j.paymentStatus === "paid" && after(j.paidAt || j.startsAt.slice(0, 10))).reduce((s, j) => s + j.price, 0);
  const paidCosts = costs
    .filter((c) => {
      const job = jobsById.get(c.jobId);
      return c.paid && job && countsAsRevenue(job) && after(job.startsAt.slice(0, 10));
    })
    .reduce((s, c) => s + c.amount, 0);
  const tx = transactions.filter((t) => t.paid && after(t.date)).reduce((s, t) => s + (t.kind === "income" ? t.amount : -t.amount), 0);
  return opening + received - paidCosts + tx;
}

export type CategoryClientRow = { category: string; total: number; share: number; byClient: Record<string, number> };

// Custos do mês por categoria e cliente ("" = sem cliente), da maior categoria para a menor
export function categoryByClient(month: string, jobs: Job[], costs: JobCost[]): { clients: string[]; rows: CategoryClientRow[]; total: number } {
  const monthJobs = new Map(jobs.filter((j) => countsAsRevenue(j) && monthOf(j.startsAt) === month).map((j) => [j.id, j]));
  const map = new Map<string, Record<string, number>>();
  const clients = new Set<string>();
  let total = 0;
  for (const c of costs) {
    const job = monthJobs.get(c.jobId);
    if (!job || !c.amount) continue;
    const client = job.clientId ?? "";
    const category = costCategoryName(c.category);
    const row = map.get(category) ?? {};
    row[client] = (row[client] ?? 0) + c.amount;
    map.set(category, row);
    clients.add(client);
    total += c.amount;
  }
  const rows = [...map].map(([category, byClient]) => {
    const sum = Object.values(byClient).reduce((s, v) => s + v, 0);
    return { category, byClient, total: sum, share: total ? sum / total : 0 };
  });
  return { clients: [...clients], rows: rows.sort((a, b) => b.total - a.total), total };
}
