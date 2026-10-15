import { costCategoryLabel } from "./labels";
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

export type MonthSummary = {
  revenue: number;
  receivable: number;
  jobCosts: number;
  otherIncome: number;
  otherExpense: number;
  profit: number;
};

export function monthlySummary(month: string, jobs: Job[], costs: JobCost[], transactions: Transaction[]): MonthSummary {
  const monthJobs = jobs.filter((j) => countsAsRevenue(j) && monthOf(j.startsAt) === month);
  const revenue = monthJobs.reduce((s, j) => s + j.price, 0);
  const receivable = monthJobs.filter((j) => j.paymentStatus === "pending").reduce((s, j) => s + j.price, 0);
  const jobCosts = monthJobs.reduce((s, j) => s + jobCostTotal(j.id, costs), 0);
  const monthTx = transactions.filter((t) => monthOf(t.date) === month);
  const otherIncome = monthTx.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0);
  const otherExpense = monthTx.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0);
  return { revenue, receivable, jobCosts, otherIncome, otherExpense, profit: revenue + otherIncome - jobCosts - otherExpense };
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
    expense: groupSum([...costs.filter((c) => ids.has(c.jobId)).map((c): [string, number] => [costCategoryLabel[c.category], c.amount]), ...txPairs("expense")]),
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
