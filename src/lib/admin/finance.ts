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
