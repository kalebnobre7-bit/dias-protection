import type { Order } from "@/lib/order";

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
  favorite: boolean;
  rating: number | null; // avaliação interna de 1 a 5 estrelas
  blacklisted: boolean; // lista negra: some da escala e das propostas
  active: boolean;
  published: boolean;
  freelance: boolean; // avulso, criado direto no serviço ou na proposta
  kind: "agent" | "driver"; // motoristas têm guia própria e não vão para o site
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
  photos: string[]; // álbum de até 6 fotos (vai no documento da proposta)
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

// Horário real de um dia; "all" vale para a equipe toda, os outros separam seguranças, motoristas e veículos
export type ShiftGroup = "all" | "agent" | "driver" | "vehicle";
export type JobShift = { date: string; group: ShiftGroup; start: string; end: string }; // "YYYY-MM-DD", "HH:mm"

export type Job = {
  id: string;
  clientId: string | null;
  serviceTypeId: string | null; // primeiro de serviceTypeIds (é o que os relatórios agrupam)
  serviceTypeIds: string[];
  startsAt: string; // "YYYY-MM-DDTHH:mm" (horário local)
  endsAt: string;
  days: string[]; // dias não contínuos ("YYYY-MM-DD"); vazio = vale o intervalo início → término
  origin: string;
  destination: string;
  status: JobStatus;
  price: number;
  paymentStatus: "pending" | "paid";
  paidAt: string; // "YYYY-MM-DD" ou ""
  notes: string;
  shifts: JobShift[]; // horários operacionais registrados (base das horas extras)
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
  advance: number; // adiantado ao fornecedor enquanto o total não é pago
  dueDate: string; // data-limite de pagamento "YYYY-MM-DD" ou ""
  overtimeHours: number; // > 0: linha de hora extra gerada pelo cálculo
  vehicleId: string | null; // hora extra de veículo
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
  category: string; // Proteção, Transporte, Amenidades, Outros (antigas: Equipe)
  description: string;
  units: number; // fator multiplicador: quantos motoristas, veículos ou agentes
  qty: number; // diárias (ou transfers) de cada um
  unitCost: number;
  extras: PricingExtra[]; // subcustos que somam no custo unitário (pedágio, combustível…)
  // Percentuais do item, em fração sobre o preço de venda
  margin: number;
  taxes: number;
  fees: number;
};

export type PricingExtra = { id: string; description: string; amount: number };

// Percentuais em fração (0.25 = 25%), sobre o preço de venda; ao mudar, valem para todos os itens
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
  summary: string; // descrição do serviço; aparece dentro de Serviço no documento
  period: string; // "10 a 15 de outubro de 2026"; gerado pelo calendário ou texto livre (propostas antigas)
  startDate: string; // "YYYY-MM-DD" ou ""
  endDate: string; // "YYYY-MM-DD" ou "" (transfer de um dia só)
  days: string[]; // dias não contínuos ("YYYY-MM-DD"); vazio = período corrido
  en: Record<string, string>; // traduções digitadas; a chave é o texto em português
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

// Custo que se repete todo mês; vira lançamento avulso ao replicar no Financeiro
export type FixedCost = { id: string; description: string; category: string; amount: number };

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
    fixed: FixedCost[];
    dailyHours: number; // horas da diária; o que passar é hora extra
    paymentDays: number; // prazo para pagar a equipe e fornecedores depois do serviço
  };
  finance: {
    cashOpening: number; // saldo em caixa na data abaixo
    cashDate: string; // "YYYY-MM-DD" ou ""
    notes: Record<string, string>; // descritivo de cada mês ("YYYY-MM")
  };
  createdAt: string;
};

// Pedido feito em /solicitar; vira proposta pré-preenchida no painel
export type SiteRequest = {
  id: string;
  payload: { order: Order; locale: string; message: string };
  status: "new" | "converted" | "archived";
  proposalId: string | null;
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
  siteRequests: SiteRequest;
};

export type TableName = keyof Tables;
