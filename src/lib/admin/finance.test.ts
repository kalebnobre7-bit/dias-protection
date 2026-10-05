import { describe, expect, it } from "vitest";

import { countsAsRevenue, jobCostTotal, monthlySummary, monthOf, shiftMonth } from "./finance";
import type { Job, JobCost, Transaction } from "./types";

const job = (over: Partial<Job>): Job => ({
  id: "j",
  clientId: null,
  serviceTypeId: null,
  startsAt: "2026-10-05T09:00",
  endsAt: "",
  origin: "",
  destination: "",
  status: "scheduled",
  price: 0,
  paymentStatus: "pending",
  paidAt: "",
  notes: "",
  agentIds: [],
  vehicleIds: [],
  createdAt: "",
  ...over,
});

const cost = (over: Partial<JobCost>): JobCost => ({
  id: "c",
  jobId: "j",
  description: "",
  category: "other",
  amount: 0,
  agentId: null,
  partnerId: null,
  paid: false,
  createdAt: "",
  ...over,
});

const tx = (over: Partial<Transaction>): Transaction => ({
  id: "t",
  kind: "expense",
  description: "",
  category: "",
  amount: 0,
  date: "2026-10-01",
  paid: false,
  createdAt: "",
  ...over,
});

describe("countsAsRevenue", () => {
  it("só agendado e concluído entram na receita (mesma regra da view monthly_summary)", () => {
    expect(countsAsRevenue(job({ status: "scheduled" }))).toBe(true);
    expect(countsAsRevenue(job({ status: "done" }))).toBe(true);
    expect(countsAsRevenue(job({ status: "quote" }))).toBe(false);
    expect(countsAsRevenue(job({ status: "canceled" }))).toBe(false);
  });
});

describe("meses", () => {
  it("monthOf pega YYYY-MM de data ou data+hora", () => {
    expect(monthOf("2026-10-05T09:00")).toBe("2026-10");
    expect(monthOf("2026-01-31")).toBe("2026-01");
  });

  it("shiftMonth vira o ano para frente e para trás", () => {
    expect(shiftMonth("2026-10", 1)).toBe("2026-11");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-03", -15)).toBe("2024-12");
    expect(shiftMonth("2026-03", 0)).toBe("2026-03");
  });
});

describe("jobCostTotal", () => {
  it("soma só os custos daquele serviço", () => {
    const costs = [
      cost({ jobId: "a", amount: 100 }),
      cost({ id: "c2", jobId: "a", amount: 50.5 }),
      cost({ id: "c3", jobId: "b", amount: 999 }),
    ];
    expect(jobCostTotal("a", costs)).toBe(150.5);
    expect(jobCostTotal("zzz", costs)).toBe(0);
  });
});

describe("monthlySummary", () => {
  const jobs = [
    job({ id: "j1", startsAt: "2026-10-05T09:00", status: "done", price: 3000, paymentStatus: "paid" }),
    job({ id: "j2", startsAt: "2026-10-20T14:00", status: "scheduled", price: 2000, paymentStatus: "pending" }),
    job({ id: "j3", startsAt: "2026-10-22T10:00", status: "quote", price: 5000 }), // orçamento: fora
    job({ id: "j4", startsAt: "2026-10-25T10:00", status: "canceled", price: 7000 }), // cancelado: fora
    job({ id: "j5", startsAt: "2026-11-02T10:00", status: "done", price: 1000 }), // outro mês
  ];
  const costs = [
    cost({ id: "c1", jobId: "j1", amount: 400 }),
    cost({ id: "c2", jobId: "j2", amount: 100 }),
    cost({ id: "c3", jobId: "j3", amount: 9999 }), // custo de orçamento não conta
    cost({ id: "c4", jobId: "j5", amount: 300 }), // custo de outro mês não conta
  ];
  const transactions = [
    tx({ id: "t1", kind: "income", amount: 250, date: "2026-10-10" }),
    tx({ id: "t2", kind: "expense", amount: 80, date: "2026-10-11" }),
    tx({ id: "t3", kind: "expense", amount: 1000, date: "2026-11-11" }), // outro mês
  ];

  it("separa receita, a receber, custos, avulsos e lucro do mês", () => {
    expect(monthlySummary("2026-10", jobs, costs, transactions)).toEqual({
      revenue: 5000,
      receivable: 2000,
      jobCosts: 500,
      otherIncome: 250,
      otherExpense: 80,
      profit: 5000 + 250 - 500 - 80,
    });
  });

  it("devolve tudo zerado num mês sem movimento", () => {
    expect(monthlySummary("2025-01", jobs, costs, transactions)).toEqual({
      revenue: 0,
      receivable: 0,
      jobCosts: 0,
      otherIncome: 0,
      otherExpense: 0,
      profit: 0,
    });
  });
});
