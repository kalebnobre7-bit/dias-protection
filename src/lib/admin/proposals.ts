import { localContent } from "@/data/content";

import { serviceTypeName } from "./catalog";
import { brl, formatDate } from "./labels";
import type { Client, ItemPreset, Job, Proposal, ProposalItem, Settings } from "./types";

// Condições gerais padrão: uma por linha, editáveis em cada proposta
export const DEFAULT_TERMS = [
  "Valores válidos até a data indicada e sujeitos à disponibilidade de equipe e veículos.",
  "Horas excedentes correspondem a 10% do valor da diária.",
  "Despesas de pedágio, estacionamento ou combustível, fora do perímetro urbano, além de hospedagem da equipe ou quaisquer outros custos não previstos, quando aplicáveis, serão repassadas ao cliente mediante comprovante de pagamento para reembolso em até 2 dias úteis a partir do final do serviço.",
  "Cancelamento com menos de 24 horas de antecedência implica cobrança de 50% do valor do serviço.",
  "Todas as informações do cliente, agenda e itinerários são tratadas com sigilo absoluto.",
].join("\n");

export const DEFAULT_PAYMENT = [
  "50% na confirmação.",
  "50% até 15 dias corridos após o serviço.",
  "Forma de pagamento: PIX ou transferência bancária.",
].join("\n");

// Catálogo rápido padrão (editável em Configurações): preenche descrição, detalhe e unidade; valor 0 = definir na proposta
export const ITEM_PRESETS: ItemPreset[] = [
  { description: "Agente de proteção armado", detail: "Diária de até 12h", unit: "diária", unitPrice: 0 },
  { description: "Agente de proteção desarmado", detail: "Diária de até 12h", unit: "diária", unitPrice: 0 },
  { description: "Motorista executivo bilíngue (PT/EN)", detail: "Diária de até 12h", unit: "diária", unitPrice: 0 },
  { description: "Transfer executivo", detail: "Deslocamento ponto a ponto, com motorista", unit: "transfer", unitPrice: 0 },
  { description: "SUV executivo com motorista", detail: "À disposição, até 10h", unit: "diária", unitPrice: 0 },
  { description: "SUV blindado com motorista", detail: "Blindagem nível III-A, até 10h", unit: "diária", unitPrice: 0 },
  { description: "Veículo de apoio com 2 agentes", detail: "Escolta veicular, até 10h", unit: "diária", unitPrice: 0 },
  { description: "Advance e análise de risco", detail: "Reconhecimento prévio de locais e rotas", unit: "un.", unitPrice: 0 },
  { description: "Coordenação de segurança do evento", detail: "Planejamento, briefing e supervisão", unit: "un.", unitPrice: 0 },
];

export const UNITS = ["diária", "transfer", "hora", "un."];

// ——— Escopo estruturado: período, natureza e seguranças ———

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const toDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Dias do período, contando o primeiro e o último (0 sem data)
export function scopeDays(p: Pick<Proposal, "startDate" | "endDate">): number {
  if (!p.startDate) return 0;
  if (!p.endDate || p.endDate === p.startDate) return 1;
  return Math.round((toDate(p.endDate).getTime() - toDate(p.startDate).getTime()) / 86_400_000) + 1;
}

// "26 a 30 de outubro de 2026", "28 de outubro a 2 de novembro de 2026", "26 de outubro de 2026"
export function periodText(start: string, end: string): string {
  if (!start) return "";
  const a = toDate(start);
  const long = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString("pt-BR", opts);
  if (!end || end === start) return long(a, { day: "numeric", month: "long", year: "numeric" });
  const b = toDate(end);
  if (a.getFullYear() !== b.getFullYear())
    return `${long(a, { day: "numeric", month: "long", year: "numeric" })} a ${long(b, { day: "numeric", month: "long", year: "numeric" })}`;
  if (a.getMonth() !== b.getMonth()) return `${long(a, { day: "numeric", month: "long" })} a ${long(b, { day: "numeric", month: "long", year: "numeric" })}`;
  return `${a.getDate()} a ${long(b, { day: "numeric", month: "long", year: "numeric" })}`;
}

// "5 diárias + 2 seguranças", "Transfer", "Transfer + 1 segurança"
export function scopeSummary(p: Pick<Proposal, "startDate" | "endDate" | "nature" | "guards">): string {
  if (!p.nature) return "";
  const days = Math.max(1, scopeDays(p));
  const base = p.nature === "daily" ? plural(days, "diária", "diárias") : days > 1 ? `${days} transfers` : "Transfer";
  return p.guards > 0 ? `${base} + ${plural(p.guards, "segurança", "seguranças")}` : base;
}

const SCOPE_VEHICLE_DAILY = "Veículo executivo com motorista";
const SCOPE_TRANSFER = "Transfer executivo";
const SCOPE_GUARD = "Agente de proteção";

// Itens que saem do escopo; o valor unitário fica com o Gabriel
export function scopeItems(p: Proposal): Omit<ProposalItem, "id" | "unitPrice">[] {
  if (!p.nature) return [];
  const days = Math.max(1, scopeDays(p));
  const cars = Math.max(1, p.vehicleIds.length);
  const items: Omit<ProposalItem, "id" | "unitPrice">[] =
    p.nature === "daily"
      ? [{ description: SCOPE_VEHICLE_DAILY, detail: `${plural(cars, "veículo", "veículos")} · ${plural(days, "diária", "diárias")} de até 10h`, qty: cars * days, unit: "diária" }]
      : [{ description: SCOPE_TRANSFER, detail: "Deslocamento ponto a ponto, com motorista", qty: cars * days, unit: "transfer" }];
  if (p.guards > 0)
    items.push({
      description: SCOPE_GUARD,
      detail: p.nature === "daily" ? `${plural(p.guards, "agente", "agentes")} · ${plural(days, "diária", "diárias")} de até 12h` : `${plural(p.guards, "agente", "agentes")} acompanhando o transfer`,
      qty: p.guards * days,
      unit: p.nature === "daily" ? "diária" : "transfer",
    });
  return items;
}

// Refaz as linhas do escopo mantendo os valores já digitados; itens manuais ficam intactos
export function mergeScopeItems(p: Proposal, newId: () => string): ProposalItem[] {
  const scopeNames = [SCOPE_VEHICLE_DAILY, SCOPE_TRANSFER, SCOPE_GUARD];
  const generated = scopeItems(p).map((g) => {
    const old = p.items.find((i) => i.description === g.description);
    return { ...g, id: old?.id ?? newId(), unitPrice: old?.unitPrice ?? 0 };
  });
  return [...generated, ...p.items.filter((i) => !scopeNames.includes(i.description))];
}

export const itemTotal =(i: ProposalItem) => (Number.isFinite(i.qty * i.unitPrice) ? i.qty * i.unitPrice : 0);

export function proposalTotals(p: Proposal): { subtotal: number; discount: number; total: number } {
  const subtotal = p.items.reduce((s, i) => s + itemTotal(i), 0);
  const discount = Math.min(p.discount, subtotal);
  return { subtotal, discount, total: subtotal - discount };
}

// "2026-003": sequencial dentro do ano. Maior número + 1 (contar repetiria número quando uma proposta é excluída)
export function nextProposalNumber(existing: Proposal[], date = new Date()): string {
  const year = String(date.getFullYear());
  const n = Math.max(0, ...existing.filter((p) => p.number.startsWith(`${year}-`)).map((p) => Number(p.number.slice(5)) || 0)) + 1;
  return `${year}-${String(n).padStart(3, "0")}`;
}

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function blankProposal(id: string, existing: Proposal[], defaults: Settings["proposal"]): Proposal {
  const today = new Date();
  const valid = new Date(today);
  valid.setDate(valid.getDate() + defaults.validityDays);
  return {
    id,
    number: nextProposalNumber(existing, today),
    clientId: null,
    jobId: null,
    title: "",
    status: "draft",
    issuedAt: isoDate(today),
    validUntil: isoDate(valid),
    serviceIds: [],
    summary: "",
    period: "",
    startDate: "",
    endDate: "",
    nature: "",
    guards: 0,
    location: "",
    items: [],
    agentIds: [],
    vehicleIds: [],
    discount: 0,
    paymentTerms: defaults.paymentTerms,
    terms: defaults.terms,
    notes: "",
    pricing: null,
    createdAt: today.toISOString(),
  };
}

// Serviço em orçamento → proposta pré-preenchida
export function proposalFromJob(job: Job, id: string, existing: Proposal[], defaults: Settings["proposal"]): Proposal {
  const base = blankProposal(id, existing, defaults);
  const start = job.startsAt ? formatDate(job.startsAt) + (job.startsAt.length > 10 ? `, ${job.startsAt.slice(11, 16)}` : "") : "";
  return {
    ...base,
    clientId: job.clientId,
    jobId: job.id,
    title: serviceTypeName(job.serviceTypeId),
    serviceIds: job.serviceTypeId ? [job.serviceTypeId] : [],
    period: start,
    location: [job.origin, job.destination].filter(Boolean).join(" → "),
    items: job.price > 0 ? [{ id: `${id}-1`, description: serviceTypeName(job.serviceTypeId), detail: "", qty: 1, unit: "un.", unitPrice: job.price }] : [],
    agentIds: job.agentIds,
    vehicleIds: job.vehicleIds,
    notes: job.notes,
    pricing: null,
  };
}

// Proposta aceita → serviço agendado com o valor fechado
export function jobFromProposal(p: Proposal, id: string): Job {
  return {
    id,
    clientId: p.clientId,
    serviceTypeId: p.serviceIds[0] ?? null,
    startsAt: "",
    endsAt: "",
    origin: "",
    destination: p.location,
    status: "scheduled",
    price: proposalTotals(p).total,
    paymentStatus: "pending",
    paidAt: "",
    notes: `Proposta ${p.number} · ${p.title}`,
    agentIds: p.agentIds,
    vehicleIds: p.vehicleIds,
    createdAt: new Date().toISOString(),
  };
}

// Resumo em texto (WhatsApp / copiar). Negrito do WhatsApp com *…*
export function proposalText(p: Proposal, client: Client | null, company: Settings["company"]): string {
  const { brandName } = localContent.company;
  const t = proposalTotals(p);
  const lines = [
    `*Proposta · ${brandName}*`,
    p.title,
    "",
    client ? `*Cliente:* ${[client.name, client.company].filter(Boolean).join(" · ")}` : "",
    scopeSummary(p) ? `*Serviço:* ${scopeSummary(p)}` : "",
    p.period ? `*Período:* ${p.period}` : "",
    p.location ? `*Local:* ${p.location}` : "",
    p.summary ? `\n${p.summary}` : "",
    "",
    "*Itens:*",
    ...p.items.map((i) => `• ${i.qty}× ${i.description}${i.detail ? ` (${i.detail})` : ""} — ${brl.format(itemTotal(i))}`),
    "",
    t.discount > 0 ? `Subtotal: ${brl.format(t.subtotal)}\nDesconto: −${brl.format(t.discount)}` : "",
    `*Total: ${brl.format(t.total)}*`,
    "",
    p.paymentTerms ? `*Pagamento:* ${p.paymentTerms}` : "",
    `*Validade:* ${formatDate(p.validUntil)}`,
    "",
    `${company.founderName} · ${brandName}`,
    [company.whatsapp && `WhatsApp +${company.whatsapp}`, company.email].filter(Boolean).join(" · "),
  ];
  return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n").trim();
}

export const onlyDigits = (s: string) => s.replace(/\D/g, "");
