import { proposalTotals } from "./proposals";
import type { Job, Proposal } from "./types";

// Alertas de validade e funil comercial (enviada → aceita → serviço realizado). Funções puras.

const DAY = 86_400_000;

const toDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`);
const p2 = (n: number) => String(n).padStart(2, "0");
const localDate = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

// Dias entre hoje e a data (negativo = já passou), contando dias de calendário no fuso local
export function daysUntil(dateIso: string, today = new Date()): number {
  if (!dateIso) return Number.POSITIVE_INFINITY;
  return Math.round((toDate(dateIso).getTime() - toDate(localDate(today)).getTime()) / DAY);
}

export type ProposalAlert = { kind: "expired" | "soon"; days: number } | null;

export const ALERT_WINDOW_DAYS = 3;

// Só propostas ainda em aberto (rascunho ou enviada) têm validade que importa
export function proposalAlert(p: Proposal, today = new Date()): ProposalAlert {
  if (p.status !== "sent" && p.status !== "draft") return null;
  const days = daysUntil(p.validUntil, today);
  if (days < 0) return { kind: "expired", days };
  if (days <= ALERT_WINDOW_DAYS) return { kind: "soon", days };
  return null;
}

export function alertLabel(alert: NonNullable<ProposalAlert>): string {
  if (alert.kind === "expired") return alert.days === -1 ? "venceu ontem" : `venceu há ${-alert.days} dias`;
  if (alert.days === 0) return "vence hoje";
  if (alert.days === 1) return "vence amanhã";
  return `vence em ${alert.days} dias`;
}

export type Funnel = {
  sent: number; // saíram do rascunho (enviadas, aceitas, recusadas ou expiradas)
  accepted: number;
  done: number; // aceitas cujo serviço foi concluído
  waiting: number; // enviadas sem resposta
  acceptRate: number | null; // aceitas / enviadas
  doneRate: number | null; // concluídas / aceitas
  acceptedValue: number;
};

export function proposalFunnel(proposals: Proposal[], jobs: Job[]): Funnel {
  const left = proposals.filter((p) => p.status !== "draft");
  const accepted = left.filter((p) => p.status === "accepted");
  const doneJobs = new Set(jobs.filter((j) => j.status === "done").map((j) => j.id));
  const done = accepted.filter((p) => p.jobId && doneJobs.has(p.jobId));
  const rate = (n: number, d: number) => (d > 0 ? n / d : null);
  return {
    sent: left.length,
    accepted: accepted.length,
    done: done.length,
    waiting: left.filter((p) => p.status === "sent").length,
    acceptRate: rate(accepted.length, left.length),
    doneRate: rate(done.length, accepted.length),
    acceptedValue: accepted.reduce((s, p) => s + proposalTotals(p).total, 0),
  };
}

export const percent = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);
