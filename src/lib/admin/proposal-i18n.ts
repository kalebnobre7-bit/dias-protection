import { proposalServiceName } from "./catalog";
import { formatDate } from "./labels";
import { daysText, DEFAULT_PAYMENT, DEFAULT_TERMS, periodText, scopeSummary } from "./proposals";
import type { Proposal } from "./types";

// Documento da proposta em português ou inglês

export type DocLang = "pt" | "en";

export const DOC_LABELS = {
  pt: {
    service: "Serviço",
    period: "Período",
    location: "Local",
    team: "Equipe",
    total: "Total",
    preparedFor: "Preparada para",
    preparedBy: "Preparada por",
    assignedTeam: "Equipe designada",
    vehicles: "Veículos",
    investment: "Investimento",
    description: "Descrição",
    qty: "Qtd.",
    unitPrice: "Unitário",
    payment: "Pagamento",
    terms: "Condições gerais",
    issuedOn: "Emitida em",
    validUntil: "válida até",
    agreed: "De acordo · data",
    subtotal: "Subtotal",
    discount: "Desconto",
    commercial: "Proposta comercial",
    confirmed: "Serviço confirmado",
    client: "Cliente",
    agent: ["agente", "agentes"],
    vehicle: ["veículo", "veículos"],
  },
  en: {
    service: "Service",
    period: "Period",
    location: "Location",
    team: "Team",
    total: "Total",
    preparedFor: "Prepared for",
    preparedBy: "Prepared by",
    assignedTeam: "Assigned team",
    vehicles: "Vehicles",
    investment: "Investment",
    description: "Description",
    qty: "Qty.",
    unitPrice: "Unit price",
    payment: "Payment",
    terms: "General terms",
    issuedOn: "Issued on",
    validUntil: "valid until",
    agreed: "Agreed · date",
    subtotal: "Subtotal",
    discount: "Discount",
    commercial: "Commercial proposal",
    confirmed: "Confirmed service",
    client: "Client",
    agent: ["agent", "agents"],
    vehicle: ["vehicle", "vehicles"],
  },
} as const;

const zip = (pt: string, en: string[]) => pt.split("\n").map((line, i): [string, string] => [line, en[i]]);

// Textos padrão do sistema já têm tradução; o que o Gabriel digita é traduzido na aba Inglês da proposta
const EN_TEXT = new Map<string, string>([
  ...zip(DEFAULT_TERMS, [
    "Prices are valid until the date indicated and subject to team and vehicle availability.",
    "Overtime hours are charged at 10% of the daily rate.",
    "Toll, parking or fuel expenses outside the urban perimeter, as well as team lodging or any other unforeseen costs, when applicable, will be passed on to the client upon proof of payment, for reimbursement within 2 business days from the end of the service.",
    "Cancellation less than 24 hours in advance incurs a charge of 50% of the service value.",
    "All client information, schedules and itineraries are treated with absolute confidentiality.",
  ]),
  ...zip(DEFAULT_PAYMENT, ["50% upon confirmation.", "50% within 15 calendar days after the service.", "Payment method: PIX or bank transfer."]),
  ["Agente mono desarmado", "Monolingual unarmed agent"],
  ["Agente mono armado", "Monolingual armed agent"],
  ["Agente bilíngue desarmado", "Bilingual unarmed agent"],
  ["Agente bilíngue armado", "Bilingual armed agent"],
  ["Motorista mono", "Monolingual driver"],
  ["Motorista bilíngue", "Bilingual driver"],
  ["Transfer mono", "Monolingual transfer"],
  ["Transfer bilíngue", "Bilingual transfer"],
  ["Veículo executivo com motorista", "Executive vehicle with driver"],
  ["Transfer executivo", "Executive transfer"],
  ["Agente de proteção", "Protection agent"],
  ["Motorista", "Driver"],
  ["Veículo", "Vehicle"],
  ["Amenidades", "Amenities"],
  ["Proteção", "Protection"],
  ["Transporte", "Transportation"],
  ["Outros", "Other"],
  ["Equipe", "Team"],
  ["Despesas adicionais", "Additional expenses"],
  ["Diária de até 12h", "Daily rate, up to 12h"],
  ["Deslocamento ponto a ponto, com motorista", "Point-to-point transfer, with driver"],
  ["diária", "day"],
  ["hora", "hour"],
  ["un.", "unit"],
]);

// Textos montados pelo escopo: "2 veículos · 5 diárias de até 10h"
const EN_WORDS: [RegExp, string][] = [
  [/veículos/g, "vehicles"],
  [/veículo/g, "vehicle"],
  [/diárias/g, "days"],
  [/diária/g, "day"],
  [/de até (\d+)h/g, "up to $1h"],
  [/agentes/g, "agents"],
  [/agente/g, "agent"],
  [/seguranças/g, "security agents"],
  [/segurança/g, "security agent"],
  [/acompanhando o transfer/g, "accompanying the transfer"],
];
const enWords = (text: string) => EN_WORDS.reduce((s, [from, to]) => s.replace(from, to), text);

// A tradução digitada na proposta vale mais que a automática
export function docText(text: string, lang: DocLang, en: Record<string, string> = {}): string {
  if (lang === "pt") return text;
  return en[text.trim()] || (EN_TEXT.get(text) ?? (/^\d+ /.test(text) ? enWords(text) : text));
}

export function docDate(iso: string, lang: DocLang): string {
  if (lang === "pt" || !iso) return formatDate(iso);
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Período gerado pelo calendário é traduzido; texto completado à mão fica como está
export function docPeriod(p: Pick<Proposal, "period" | "startDate" | "endDate" | "days">, lang: DocLang): string {
  if (lang === "pt" || !p.startDate) return p.period;
  const base = p.days.length ? daysText(p.days) : periodText(p.startDate, p.endDate);
  const rest = p.period.startsWith(base) ? p.period.slice(base.length).trim() : null;
  if (rest === null || (rest && !/^às \d\d:\d\d$/.test(rest))) return p.period;
  const long = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const range = p.days.length ? daysText(p.days, "en-US") : p.endDate && p.endDate !== p.startDate ? `${long(p.startDate)} – ${long(p.endDate)}` : long(p.startDate);
  return rest ? `${range} ${rest.replace("às", "at")}` : range;
}

// Textos livres sem tradução automática: são os campos da aba Inglês
export function textsToTranslate(p: Proposal): string[] {
  const texts = [
    p.title,
    p.location,
    docPeriod(p, "en") === p.period ? p.period : "",
    p.summary,
    ...p.items.flatMap((i) => [i.description, i.detail]),
    ...p.paymentTerms.split("\n"),
    ...p.terms.split("\n"),
  ].map((t) => t.trim());
  return [...new Set(texts)].filter((t) => t && docText(t, "en") === t);
}

// Categorias de serviço escolhidas; sem nenhuma, o resumo do escopo
export function docServices(p: Parameters<typeof scopeSummary>[0] & Pick<Proposal, "serviceIds">, lang: DocLang): string {
  if (p.serviceIds.length) return p.serviceIds.map((id) => proposalServiceName(id, lang)).join(" + ");
  return lang === "pt" ? scopeSummary(p) : enWords(scopeSummary(p));
}
