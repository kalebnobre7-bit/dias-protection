import type { AgentRecord, Job, JobCost, JobShift, ShiftGroup, Vehicle } from "./types";

// Horas extras pelos horários registrados no serviço. Puro: sem React nem Supabase.

const DAY = 86_400_000;
const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// Dias do serviço: os avulsos ou o intervalo início → término
export function jobDates(j: Pick<Job, "days" | "startsAt" | "endsAt">): string[] {
  if (j.days.length) return [...j.days].sort();
  const start = j.startsAt.slice(0, 10);
  const end = j.endsAt.slice(0, 10) || start;
  const out: string[] = [];
  for (let d = start; d <= end && out.length < 366; d = addDays(d, 1)) out.push(d);
  return out;
}

// 22:00 → 06:00 conta 8 h (vira a meia-noite)
export function shiftHours(s: Pick<JobShift, "start" | "end">): number {
  if (!/^\d\d:\d\d$/.test(s.start) || !/^\d\d:\d\d$/.test(s.end)) return 0;
  const diff = toMinutes(s.end) - toMinutes(s.start);
  return (diff <= 0 ? diff + 1440 : diff) / 60;
}

// Horário do grupo naquele dia; sem horário próprio, vale o geral
export const shiftOf = (shifts: JobShift[], date: string, group: ShiftGroup) =>
  shifts.find((s) => s.date === date && s.group === group) ?? shifts.find((s) => s.date === date && s.group === "all");

export function overtimeHours(job: Pick<Job, "days" | "startsAt" | "endsAt" | "shifts">, group: ShiftGroup, dailyHours: number): number {
  const total = jobDates(job).reduce((sum, date) => {
    const s = shiftOf(job.shifts, date, group);
    return sum + (s ? Math.max(shiftHours(s) - dailyHours, 0) : 0);
  }, 0);
  return Math.round(total * 100) / 100;
}

// Vencimento: último dia do serviço + prazo
export const defaultDueDate = (job: Pick<Job, "days" | "startsAt" | "endsAt">, paymentDays: number) => addDays(jobDates(job).at(-1) ?? job.startsAt.slice(0, 10), paymentDays);

export type OvertimeRow = {
  key: string; // agentId ou vehicleId
  label: string;
  group: ShiftGroup;
  agentId: string | null;
  vehicleId: string | null;
  partnerId: string | null;
  hours: number;
  rate: number; // R$ por hora extra, pago a quem fez
};

// Uma linha por pessoa ou veículo do serviço com hora extra. Valor da hora: o da linha já gerada
// ou a diária lançada para a pessoa ÷ dias ÷ horas por diária
export function overtimeRows(job: Job, costs: JobCost[], agents: AgentRecord[], vehicles: Vehicle[], dailyHours: number): OvertimeRow[] {
  const days = jobDates(job).length;
  const previous = (key: string) => costs.find((c) => c.overtimeHours > 0 && (c.agentId === key || c.vehicleId === key));
  const rateOf = (key: string, base: number) => {
    const p = previous(key);
    return p ? Math.round((p.amount / p.overtimeHours) * 100) / 100 : Math.round((base / days / dailyHours) * 100) / 100;
  };
  const people = job.agentIds
    .map((id) => agents.find((a) => a.id === id))
    .filter((a): a is AgentRecord => !!a)
    .map((a): OvertimeRow => {
      const base = costs.filter((c) => c.agentId === a.id && c.overtimeHours === 0).reduce((s, c) => s + c.amount, 0);
      return { key: a.id, label: a.name, group: a.kind, agentId: a.id, vehicleId: null, partnerId: null, hours: overtimeHours(job, a.kind, dailyHours), rate: rateOf(a.id, base) };
    });
  const cars = job.vehicleIds
    .map((id) => vehicles.find((v) => v.id === id))
    .filter((v): v is Vehicle => !!v)
    .map((v): OvertimeRow => ({
      key: v.id,
      label: [v.model, v.plate].filter(Boolean).join(" · "),
      group: "vehicle",
      agentId: null,
      vehicleId: v.id,
      partnerId: v.owner === "partner" ? v.partnerId : null,
      hours: overtimeHours(job, "vehicle", dailyHours),
      rate: rateOf(v.id, 0),
    }));
  return [...people, ...cars].filter((r) => r.hours > 0);
}

const hoursText = (h: number) => `${h.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`;

// Troca as linhas de hora extra pelas recalculadas; a linha que já existia mantém id, pago e adiantamento
export function applyOvertime(costs: JobCost[], rows: OvertimeRow[], jobId: string, dueDate: string): JobCost[] {
  const kept = costs.filter((c) => c.overtimeHours === 0);
  const lines = rows
    .filter((r) => r.hours > 0 && r.rate > 0)
    .map((r): JobCost => {
      const old = costs.find((c) => c.overtimeHours > 0 && (r.agentId ? c.agentId === r.agentId : c.vehicleId === r.vehicleId));
      return {
        id: old?.id ?? crypto.randomUUID(),
        jobId,
        description: `Hora extra · ${r.label} · ${hoursText(r.hours)}`,
        category: r.agentId ? "agent" : r.partnerId ? "partner" : "Aluguel Veículo",
        amount: Math.round(r.hours * r.rate * 100) / 100,
        agentId: r.agentId,
        partnerId: r.partnerId,
        paid: old?.paid ?? false,
        advance: old?.advance ?? 0,
        dueDate: old?.dueDate || dueDate,
        overtimeHours: r.hours,
        vehicleId: r.vehicleId,
        createdAt: old?.createdAt ?? new Date().toISOString(),
      };
    });
  return [...kept, ...lines];
}

// Quanto cobrar do cliente pelas horas extras mantendo a margem do serviço (preço ÷ custos sem hora extra)
export function overtimeCharge(price: number, costs: JobCost[], overtimeCost: number): number {
  const base = costs.filter((c) => c.overtimeHours === 0).reduce((s, c) => s + c.amount, 0);
  const factor = base > 0 && price > base ? price / base : 1;
  return Math.ceil(overtimeCost * factor);
}
