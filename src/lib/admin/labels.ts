import type { CostCategory, JobStatus, ProposalStatus } from "./types";

export const jobStatusLabel: Record<JobStatus, string> = {
  quote: "Orçamento",
  scheduled: "Agendado",
  done: "Concluído",
  canceled: "Cancelado",
};

export const proposalStatusLabel: Record<ProposalStatus, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  accepted: "Aceita",
  declined: "Recusada",
  expired: "Expirada",
};

export const proposalStatusTone = (s: ProposalStatus) =>
  (({ draft: "neutral", sent: "accent", accepted: "good", declined: "bad", expired: "warn" }) as const)[s];

export const costCategoryLabel: Record<CostCategory, string> = {
  agent: "Agente",
  partner: "Parceiro",
  fuel: "Combustível",
  toll: "Pedágio",
  food: "Alimentação",
  other: "Outros",
};

export const clientLanguageLabel = { pt: "Português", en: "Inglês", other: "Outro" } as const;

export const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// "2026-09-28T14:30" → "28 set, 14:30"
export function formatDateTime(value: string): string {
  if (!value) return "";
  const d = new Date(value.length > 10 ? value : `${value}T00:00`);
  const date = `${d.getDate()} ${d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}`;
  return value.length > 10 ? `${date}, ${value.slice(11, 16)}` : date;
}

// "2026-10-10" → "10/10/2026"
export function formatDate(value: string): string {
  if (!value) return "";
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// "2026-10-10" → "10 de outubro de 2026"
export function formatDateLong(value: string): string {
  if (!value) return "";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
