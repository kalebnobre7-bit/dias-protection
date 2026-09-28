import type { CostCategory, JobStatus } from "./types";

export const jobStatusLabel: Record<JobStatus, string> = {
  quote: "Orçamento",
  scheduled: "Agendado",
  done: "Concluído",
  canceled: "Cancelado",
};

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

export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
