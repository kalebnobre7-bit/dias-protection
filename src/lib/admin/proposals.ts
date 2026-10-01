import { localContent } from "@/data/content";

import { serviceTypeName } from "./catalog";
import { brl, formatDate } from "./labels";
import type { Client, Job, Proposal, ProposalItem } from "./types";

// Condições gerais padrão: uma por linha, editáveis em cada proposta
export const DEFAULT_TERMS = [
  "Valores válidos até a data indicada e sujeitos a disponibilidade de equipe e veículos.",
  "Horas excedentes ao período contratado são cobradas proporcionalmente ao valor da diária.",
  "Despesas de pedágio, estacionamento, combustível fora do perímetro urbano e hospedagem da equipe, quando aplicáveis, são repassadas ao cliente mediante comprovante.",
  "Cancelamento com menos de 24 horas de antecedência implica cobrança de 50% do valor do serviço.",
  "Todas as informações do cliente, agenda e itinerários são tratadas com sigilo absoluto.",
].join("\n");

export const DEFAULT_PAYMENT = "50% na confirmação e 50% até 2 dias úteis após o serviço. PIX ou transferência bancária.";

// Catálogo rápido: preenche descrição, unidade e detalhe; o valor fica com o Gabriel
export const ITEM_PRESETS: { label: string; item: Omit<ProposalItem, "id" | "unitPrice"> }[] = [
  { label: "Agente de proteção (armado)", item: { description: "Agente de proteção armado", detail: "Diária de até 12h", qty: 1, unit: "diária" } },
  { label: "Agente de proteção (desarmado)", item: { description: "Agente de proteção desarmado", detail: "Diária de até 12h", qty: 1, unit: "diária" } },
  { label: "Motorista bilíngue", item: { description: "Motorista executivo bilíngue (PT/EN)", detail: "Diária de até 12h", qty: 1, unit: "diária" } },
  { label: "Transfer executivo", item: { description: "Transfer executivo", detail: "Deslocamento ponto a ponto, com motorista", qty: 1, unit: "transfer" } },
  { label: "Diária SUV executivo", item: { description: "SUV executivo com motorista", detail: "À disposição, até 12h", qty: 1, unit: "diária" } },
  { label: "Diária SUV blindado", item: { description: "SUV blindado com motorista", detail: "Blindagem nível III-A, até 12h", qty: 1, unit: "diária" } },
  { label: "Veículo de apoio (escolta)", item: { description: "Veículo de apoio com 2 agentes", detail: "Escolta veicular, até 12h", qty: 1, unit: "diária" } },
  { label: "Advance / análise de risco", item: { description: "Advance e análise de risco", detail: "Reconhecimento prévio de locais e rotas", qty: 1, unit: "un." } },
  { label: "Coordenação de evento", item: { description: "Coordenação de segurança do evento", detail: "Planejamento, briefing e supervisão", qty: 1, unit: "un." } },
];

export const UNITS = ["diária", "transfer", "hora", "un."];

export const itemTotal = (i: ProposalItem) => (Number.isFinite(i.qty * i.unitPrice) ? i.qty * i.unitPrice : 0);

export function proposalTotals(p: Proposal): { subtotal: number; discount: number; total: number } {
  const subtotal = p.items.reduce((s, i) => s + itemTotal(i), 0);
  const discount = Math.min(p.discount, subtotal);
  return { subtotal, discount, total: subtotal - discount };
}

// "2026-003": sequencial dentro do ano
export function nextProposalNumber(existing: Proposal[], date = new Date()): string {
  const year = String(date.getFullYear());
  const n = existing.filter((p) => p.number.startsWith(`${year}-`)).length + 1;
  return `${year}-${String(n).padStart(3, "0")}`;
}

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function blankProposal(id: string, existing: Proposal[]): Proposal {
  const today = new Date();
  const valid = new Date(today);
  valid.setDate(valid.getDate() + 10);
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
    location: "",
    items: [],
    discount: 0,
    paymentTerms: DEFAULT_PAYMENT,
    terms: DEFAULT_TERMS,
    notes: "",
    createdAt: today.toISOString(),
  };
}

// Serviço em orçamento → proposta pré-preenchida
export function proposalFromJob(job: Job, id: string, existing: Proposal[]): Proposal {
  const base = blankProposal(id, existing);
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
    notes: job.notes,
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
    agentIds: [],
    vehicleIds: [],
    createdAt: new Date().toISOString(),
  };
}

// Resumo em texto (WhatsApp / copiar). Negrito do WhatsApp com *…*
export function proposalText(p: Proposal, client: Client | null): string {
  const { company } = localContent;
  const t = proposalTotals(p);
  const lines = [
    `*Proposta ${p.number} · ${company.brandName}*`,
    p.title,
    "",
    client ? `*Cliente:* ${[client.name, client.company].filter(Boolean).join(" · ")}` : "",
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
    `${company.founderName} · ${company.brandName}`,
    `WhatsApp +${company.whatsapp} · ${company.email}`,
  ];
  return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n").trim();
}

export const onlyDigits = (s: string) => s.replace(/\D/g, "");
