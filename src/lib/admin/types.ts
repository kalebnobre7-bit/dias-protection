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
  career: string; // experiência profissional para o currículo, uma por linha
  phone: string;
  documentId: string;
  cnhUrl: string | null; // imagem da CNH (vai só no documento de serviço fechado)
  notes: string;
  active: boolean;
  published: boolean;
  freelance: boolean; // avulso, criado direto no serviço ou na proposta
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
  // públicos (vão para a página Frota quando published)
  published: boolean;
  photoUrl: string | null;
  descriptionPt: string;
  descriptionEn: string;
  capacity: number | null;
  armored: boolean;
  createdAt: string;
};

export type Representative = { id: string; name: string; role: string; contact: string };

export type Client = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  language: "pt" | "en" | "other" | null;
  representatives: Representative[]; // pessoas da empresa cliente (nome, cargo, contato)
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

// "agent" e "partner" são fixos (abrem a escolha do agente/parceiro); o resto é o nome da categoria (Configurações)
export type CostCategory = string;

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

// Categoria personalizável dos lançamentos avulsos (o lançamento guarda o nome)
export type FinanceCategory = {
  id: string;
  name: string;
  kind: "expense" | "income" | "both";
  createdAt: string;
};

// Calculadora de preço (espelho da planilha de precificação do Gabriel)
export type PricingCost = {
  id: string;
  category: string; // Equipe, Transporte, Amenidades, Outros
  description: string;
  qty: number;
  unitCost: number;
};

// Percentuais em fração (0.25 = 25%), sobre o preço de venda
export type Pricing = {
  costs: PricingCost[];
  margin: number;
  taxes: number;
  fees: number;
};

export type ProposalStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export type ProposalNature = "daily" | "transfer" | "";

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
  period: string; // "10 a 15 de outubro de 2026"; gerado pelo calendário ou texto livre (propostas antigas)
  startDate: string; // "YYYY-MM-DD" ou ""
  endDate: string; // "YYYY-MM-DD" ou "" (transfer de um dia só)
  nature: ProposalNature;
  guards: number; // seguranças; 0 = sem segurança
  location: string;
  items: ProposalItem[];
  agentIds: string[]; // motoristas e seguranças apresentados no documento
  vehicleIds: string[];
  discount: number;
  paymentTerms: string;
  terms: string; // condições gerais (uma por linha)
  notes: string; // internas, não vão para o documento
  pricing: Pricing | null; // calculadora de preço, interna
  createdAt: string;
};

// Item pronto do catálogo da proposta (preenche descrição, detalhe, unidade e valor)
export type ItemPreset = {
  description: string;
  detail: string;
  unit: string;
  unitPrice: number;
};

// Configurações do painel: uma linha só (id "app")
export type Settings = {
  id: string;
  company: {
    founderName: string;
    founderRole: string;
    legalName: string;
    whatsapp: string; // só números, com DDI e DDD
    email: string;
    instagram: string;
    city: string;
  };
  proposal: {
    validityDays: number;
    paymentTerms: string;
    terms: string;
    units: string[];
    presets: ItemPreset[];
  };
  costs: {
    categories: string[]; // além de Agente e Parceiro, que são fixos
  };
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
  financeCategories: FinanceCategory;
  proposals: Proposal;
  settings: Settings;
};

export type TableName = keyof Tables;
