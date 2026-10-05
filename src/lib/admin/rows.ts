import type { AgentRecord, Client, Job, JobCost, Partner, Proposal, ProposalItem, TableName, Transaction, Vehicle } from "./types";

// Tradução entre os tipos do painel (camelCase, "" para texto vazio) e as linhas do Postgres
// (snake_case, null). Funções puras, sem Supabase: scripts/import-json.mjs também usa.
// Atenção: colunas numeric chegam do PostgREST como string, por isso Number() em tudo.

export const TABLES: Record<TableName, string> = {
  agents: "agents",
  vehicles: "vehicles",
  clients: "clients",
  partners: "partners",
  jobs: "jobs",
  jobCosts: "job_costs",
  transactions: "transactions",
  proposals: "proposals",
};

const text = (v: unknown): string => (v == null ? "" : String(v));
const orNull = (s: string): string | null => (s.trim() === "" ? null : s);
const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const intOrNull = (v: unknown): number | null => (v == null || v === "" ? null : num(v));
const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
const bool = (v: unknown): boolean => v === true || v === "true" || v === "t";
const idOrNull = (v: unknown): string | null => (v == null || v === "" ? null : String(v));
const dateOnly = (v: unknown): string => text(v).slice(0, 10);

// "2026-10-05T09:00" (horário local de quem usa o painel) ↔ timestamptz (ISO em UTC)
export function localToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local.length === 16 ? `${local}:00` : local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function isoToLocal(iso: unknown): string {
  if (!iso) return "";
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const createdAt = (v: unknown): string => text(v) || new Date().toISOString();

// ───────── agents ─────────

export const AGENT_COLUMNS =
  "id, name, role_pt, role_en, bio_pt, bio_en, languages, years_experience, certifications, photo_url, phone, document_id, notes, active, published, sort_order, created_at";

export type AgentRow = {
  id: string;
  name: string;
  role_pt: string;
  role_en: string;
  bio_pt: string;
  bio_en: string;
  languages: string[];
  years_experience: number | null;
  certifications: string[];
  photo_url: string | null;
  phone: string | null;
  document_id: string | null;
  notes: string | null;
  active: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
};

export const agentToRow = (a: AgentRecord): AgentRow => ({
  id: a.id,
  name: a.name,
  role_pt: a.rolePt,
  role_en: a.roleEn,
  bio_pt: a.bioPt,
  bio_en: a.bioEn,
  languages: a.languages,
  years_experience: a.yearsExperience,
  certifications: a.certifications,
  photo_url: a.photoUrl,
  phone: orNull(a.phone),
  document_id: orNull(a.documentId),
  notes: orNull(a.notes),
  active: a.active,
  published: a.published,
  sort_order: a.sortOrder,
  created_at: a.createdAt,
});

export const agentFromRow = (r: Partial<AgentRow>): AgentRecord => ({
  id: text(r.id),
  name: text(r.name),
  rolePt: text(r.role_pt),
  roleEn: text(r.role_en),
  bioPt: text(r.bio_pt),
  bioEn: text(r.bio_en),
  languages: list(r.languages),
  yearsExperience: intOrNull(r.years_experience),
  certifications: list(r.certifications),
  photoUrl: idOrNull(r.photo_url),
  phone: text(r.phone),
  documentId: text(r.document_id),
  notes: text(r.notes),
  active: bool(r.active),
  published: bool(r.published),
  sortOrder: num(r.sort_order),
  createdAt: createdAt(r.created_at),
});

// ───────── vehicles ─────────

export const VEHICLE_COLUMNS =
  "id, category_id, model, plate, color, year, owner, partner_id, active, notes, published, photo_url, description_pt, description_en, capacity, armored, created_at";

export type VehicleRow = {
  id: string;
  category_id: string | null;
  model: string;
  plate: string | null;
  color: string | null;
  year: number | null;
  owner: "own" | "partner";
  partner_id: string | null;
  active: boolean;
  notes: string | null;
  published: boolean;
  photo_url: string | null;
  description_pt: string;
  description_en: string;
  capacity: number | null;
  armored: boolean;
  created_at: string;
};

export const vehicleToRow = (v: Vehicle): VehicleRow => ({
  id: v.id,
  category_id: v.categoryId,
  model: v.model,
  plate: orNull(v.plate),
  color: orNull(v.color),
  year: v.year,
  owner: v.owner,
  partner_id: v.owner === "partner" ? v.partnerId : null,
  active: v.active,
  notes: orNull(v.notes),
  published: v.published,
  photo_url: v.photoUrl,
  description_pt: v.descriptionPt,
  description_en: v.descriptionEn,
  capacity: v.capacity,
  armored: v.armored,
  created_at: v.createdAt,
});

export const vehicleFromRow = (r: Partial<VehicleRow>): Vehicle => ({
  id: text(r.id),
  categoryId: idOrNull(r.category_id),
  model: text(r.model),
  plate: text(r.plate),
  color: text(r.color),
  year: intOrNull(r.year),
  owner: r.owner === "partner" ? "partner" : "own",
  partnerId: idOrNull(r.partner_id),
  active: bool(r.active),
  notes: text(r.notes),
  published: bool(r.published),
  photoUrl: idOrNull(r.photo_url),
  descriptionPt: text(r.description_pt),
  descriptionEn: text(r.description_en),
  capacity: intOrNull(r.capacity),
  armored: bool(r.armored),
  createdAt: createdAt(r.created_at),
});

// ───────── clients ─────────

export const CLIENT_COLUMNS = "id, name, company, phone, email, language, notes, created_at";

export type ClientRow = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  language: "pt" | "en" | "other" | null;
  notes: string | null;
  created_at: string;
};

export const clientToRow = (c: Client): ClientRow => ({
  id: c.id,
  name: c.name,
  company: orNull(c.company),
  phone: orNull(c.phone),
  email: orNull(c.email),
  language: c.language,
  notes: orNull(c.notes),
  created_at: c.createdAt,
});

export const clientFromRow = (r: Partial<ClientRow>): Client => ({
  id: text(r.id),
  name: text(r.name),
  company: text(r.company),
  phone: text(r.phone),
  email: text(r.email),
  language: r.language === "pt" || r.language === "en" || r.language === "other" ? r.language : null,
  notes: text(r.notes),
  createdAt: createdAt(r.created_at),
});

// ───────── partners ─────────

export const PARTNER_COLUMNS = "id, name, kind, contact, phone, email, notes, created_at";

export type PartnerRow = {
  id: string;
  name: string;
  kind: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export const partnerToRow = (p: Partner): PartnerRow => ({
  id: p.id,
  name: p.name,
  kind: p.kind,
  contact: orNull(p.contact),
  phone: orNull(p.phone),
  email: orNull(p.email),
  notes: orNull(p.notes),
  created_at: p.createdAt,
});

export const partnerFromRow = (r: Partial<PartnerRow>): Partner => ({
  id: text(r.id),
  name: text(r.name),
  kind: text(r.kind),
  contact: text(r.contact),
  phone: text(r.phone),
  email: text(r.email),
  notes: text(r.notes),
  createdAt: createdAt(r.created_at),
});

// ───────── jobs (+ job_agents / job_vehicles) ─────────

export const JOB_COLUMNS =
  "id, client_id, service_type_id, starts_at, ends_at, origin, destination, status, price, payment_status, paid_at, notes, created_at";

export type JobRow = {
  id: string;
  client_id: string | null;
  service_type_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  origin: string | null;
  destination: string | null;
  status: Job["status"];
  price: number | string;
  payment_status: Job["paymentStatus"];
  paid_at: string | null;
  notes: string | null;
  created_at: string;
};

export type JobAgentRow = { job_id: string; agent_id: string };
export type JobVehicleRow = { job_id: string; vehicle_id: string };

export const jobToRow = (j: Job): JobRow => ({
  id: j.id,
  client_id: j.clientId,
  service_type_id: j.serviceTypeId,
  starts_at: localToIso(j.startsAt),
  ends_at: localToIso(j.endsAt),
  origin: orNull(j.origin),
  destination: orNull(j.destination),
  status: j.status,
  price: j.price,
  payment_status: j.paymentStatus,
  paid_at: orNull(j.paidAt),
  notes: orNull(j.notes),
  created_at: j.createdAt,
});

export const jobLinks = (j: Job): { agents: JobAgentRow[]; vehicles: JobVehicleRow[] } => ({
  agents: [...new Set(j.agentIds)].map((agent_id) => ({ job_id: j.id, agent_id })),
  vehicles: [...new Set(j.vehicleIds)].map((vehicle_id) => ({ job_id: j.id, vehicle_id })),
});

const JOB_STATUSES: Job["status"][] = ["quote", "scheduled", "done", "canceled"];

export const jobFromRow = (r: Partial<JobRow>, agentIds: string[] = [], vehicleIds: string[] = []): Job => ({
  id: text(r.id),
  clientId: idOrNull(r.client_id),
  serviceTypeId: idOrNull(r.service_type_id),
  startsAt: isoToLocal(r.starts_at),
  endsAt: isoToLocal(r.ends_at),
  origin: text(r.origin),
  destination: text(r.destination),
  status: JOB_STATUSES.includes(r.status as Job["status"]) ? (r.status as Job["status"]) : "scheduled",
  price: num(r.price),
  paymentStatus: r.payment_status === "paid" ? "paid" : "pending",
  paidAt: dateOnly(r.paid_at),
  notes: text(r.notes),
  agentIds,
  vehicleIds,
  createdAt: createdAt(r.created_at),
});

// ───────── job_costs ─────────

export const JOB_COST_COLUMNS = "id, job_id, description, category, amount, agent_id, partner_id, paid, created_at";

export type JobCostRow = {
  id: string;
  job_id: string;
  description: string;
  category: JobCost["category"];
  amount: number | string;
  agent_id: string | null;
  partner_id: string | null;
  paid: boolean;
  created_at: string;
};

export const jobCostToRow = (c: JobCost): JobCostRow => ({
  id: c.id,
  job_id: c.jobId,
  description: c.description,
  category: c.category,
  amount: c.amount,
  agent_id: c.agentId,
  partner_id: c.partnerId,
  paid: c.paid,
  created_at: c.createdAt,
});

const COST_CATEGORIES: JobCost["category"][] = ["agent", "partner", "fuel", "toll", "food", "other"];

export const jobCostFromRow = (r: Partial<JobCostRow>): JobCost => ({
  id: text(r.id),
  jobId: text(r.job_id),
  description: text(r.description),
  category: COST_CATEGORIES.includes(r.category as JobCost["category"]) ? (r.category as JobCost["category"]) : "other",
  amount: num(r.amount),
  agentId: idOrNull(r.agent_id),
  partnerId: idOrNull(r.partner_id),
  paid: bool(r.paid),
  createdAt: createdAt(r.created_at),
});

// ───────── transactions ─────────

export const TRANSACTION_COLUMNS = "id, kind, description, category, amount, date, paid, created_at";

export type TransactionRow = {
  id: string;
  kind: Transaction["kind"];
  description: string;
  category: string;
  amount: number | string;
  date: string;
  paid: boolean;
  created_at: string;
};

export const transactionToRow = (t: Transaction): TransactionRow => ({
  id: t.id,
  kind: t.kind,
  description: t.description,
  category: t.category || "other",
  amount: t.amount,
  date: t.date,
  paid: t.paid,
  created_at: t.createdAt,
});

export const transactionFromRow = (r: Partial<TransactionRow>): Transaction => ({
  id: text(r.id),
  kind: r.kind === "income" ? "income" : "expense",
  description: text(r.description),
  category: text(r.category),
  amount: num(r.amount),
  date: dateOnly(r.date),
  paid: bool(r.paid),
  createdAt: createdAt(r.created_at),
});

// ───────── proposals (+ proposal_items) ─────────

export const PROPOSAL_COLUMNS =
  "id, number, client_id, job_id, title, status, issued_at, valid_until, service_ids, summary, period, location, discount, payment_terms, terms, notes, created_at";
export const PROPOSAL_ITEM_COLUMNS = "id, proposal_id, description, detail, qty, unit, unit_price, sort_order";

export type ProposalRow = {
  id: string;
  number: string;
  client_id: string | null;
  job_id: string | null;
  title: string;
  status: Proposal["status"];
  issued_at: string;
  valid_until: string;
  service_ids: string[];
  summary: string;
  period: string;
  location: string;
  discount: number | string;
  payment_terms: string;
  terms: string;
  notes: string;
  created_at: string;
};

export type ProposalItemRow = {
  id: string;
  proposal_id: string;
  description: string;
  detail: string;
  qty: number | string;
  unit: string;
  unit_price: number | string;
  sort_order: number;
};

export const proposalToRow = (p: Proposal): ProposalRow => ({
  id: p.id,
  number: p.number,
  client_id: p.clientId,
  job_id: p.jobId,
  title: p.title,
  status: p.status,
  issued_at: p.issuedAt,
  valid_until: p.validUntil,
  service_ids: p.serviceIds,
  summary: p.summary,
  period: p.period,
  location: p.location,
  discount: p.discount,
  payment_terms: p.paymentTerms,
  terms: p.terms,
  notes: p.notes,
  created_at: p.createdAt,
});

export const proposalItemsToRows = (p: Proposal): ProposalItemRow[] =>
  p.items.map((i, index) => ({
    id: i.id,
    proposal_id: p.id,
    description: i.description,
    detail: i.detail,
    qty: i.qty,
    unit: i.unit,
    unit_price: i.unitPrice,
    sort_order: index,
  }));

const PROPOSAL_STATUSES: Proposal["status"][] = ["draft", "sent", "accepted", "declined", "expired"];

export const proposalItemFromRow = (r: Partial<ProposalItemRow>): ProposalItem => ({
  id: text(r.id),
  description: text(r.description),
  detail: text(r.detail),
  qty: num(r.qty, 1),
  unit: text(r.unit) || "un.",
  unitPrice: num(r.unit_price),
});

export const proposalFromRow = (r: Partial<ProposalRow>, items: Partial<ProposalItemRow>[] = []): Proposal => ({
  id: text(r.id),
  number: text(r.number),
  clientId: idOrNull(r.client_id),
  jobId: idOrNull(r.job_id),
  title: text(r.title),
  status: PROPOSAL_STATUSES.includes(r.status as Proposal["status"]) ? (r.status as Proposal["status"]) : "draft",
  issuedAt: dateOnly(r.issued_at),
  validUntil: dateOnly(r.valid_until),
  serviceIds: list(r.service_ids),
  summary: text(r.summary),
  period: text(r.period),
  location: text(r.location),
  items: [...items].sort((a, b) => num(a.sort_order) - num(b.sort_order)).map(proposalItemFromRow),
  discount: num(r.discount),
  paymentTerms: text(r.payment_terms),
  terms: text(r.terms),
  notes: text(r.notes),
  createdAt: createdAt(r.created_at),
});
