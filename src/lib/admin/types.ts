// Espelham as tabelas de supabase/migrations/0001_init.sql (snake_case lá, camelCase aqui).
// Textos opcionais usam "" em vez de null para simplificar os formulários.
// job_agents / job_vehicles viram os arrays agentIds / vehicleIds de Job.

export type AgentRecord = {
  id: string;
  name: string;
  rolePt: string;
  roleEn: string;
  bioPt: string;
  bioEn: string;
  languages: string[];
  yearsExperience: number | null;
  certifications: string[];
  photoUrl: string | null;
  // internos (nunca vão para o site)
  phone: string;
  documentId: string;
  notes: string;
  active: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: string;
};

export type Vehicle = {
  id: string;
  categoryId: string | null;
  model: string;
  plate: string;
  color: string;
  year: number | null;
  owner: "own" | "partner";
  partnerId: string | null;
  active: boolean;
  notes: string;
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  language: "pt" | "en" | "other" | null;
  notes: string;
  createdAt: string;
};

export type Partner = {
  id: string;
  name: string;
  kind: string; // hotel, locadora, fornecedor, freelancer…
  contact: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
};

export type JobStatus = "quote" | "scheduled" | "done" | "canceled";

export type Job = {
  id: string;
  clientId: string | null;
  serviceTypeId: string | null;
  startsAt: string; // "YYYY-MM-DDTHH:mm" (horário local)
  endsAt: string;
  origin: string;
  destination: string;
  status: JobStatus;
  price: number;
  paymentStatus: "pending" | "paid";
  paidAt: string; // "YYYY-MM-DD" ou ""
  notes: string;
  agentIds: string[];
  vehicleIds: string[];
  createdAt: string;
};

export type CostCategory = "agent" | "partner" | "fuel" | "toll" | "food" | "other";

export type JobCost = {
  id: string;
  jobId: string;
  description: string;
  category: CostCategory;
  amount: number;
  agentId: string | null;
  partnerId: string | null;
  paid: boolean;
  createdAt: string;
};

export type Transaction = {
  id: string;
  kind: "income" | "expense";
  description: string;
  category: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  paid: boolean;
  createdAt: string;
};

export type ProposalStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export type ProposalItem = {
  id: string;
  description: string;
  detail: string; // linha menor abaixo da descrição (ex.: "2 agentes · 12h")
  qty: number;
  unit: string; // diária, transfer, hora, un.
  unitPrice: number;
};

// Proposta comercial / orçamento. Vira documento A4 em /admin/propostas/documento?id=…
export type Proposal = {
  id: string;
  number: string; // "2026-001", sequencial por ano
  clientId: string | null;
  jobId: string | null; // serviço de origem ou gerado a partir dela
  title: string;
  status: ProposalStatus;
  issuedAt: string; // "YYYY-MM-DD"
  validUntil: string; // "YYYY-MM-DD"
  serviceIds: string[]; // tipos de serviço do site
  summary: string; // contexto e escopo, em texto corrido
  period: string; // "10 a 15 de outubro de 2026", texto livre
  location: string;
  items: ProposalItem[];
  discount: number;
  paymentTerms: string;
  terms: string; // condições gerais (uma por linha)
  notes: string; // internas, não vão para o documento
  createdAt: string;
};

export type Tables = {
  agents: AgentRecord;
  vehicles: Vehicle;
  clients: Client;
  partners: Partner;
  jobs: Job;
  jobCosts: JobCost;
  transactions: Transaction;
  proposals: Proposal;
};

export type TableName = keyof Tables;
export type Database = { [K in TableName]: Tables[K][] };
