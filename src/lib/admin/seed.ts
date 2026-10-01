import { DEFAULT_TERMS } from "./proposals";
import type { Database } from "./types";

// Login da demonstração (só até o Supabase Auth entrar; não protege nada de verdade)
export const DEMO_LOGIN = { email: "gabriel@diasprotection.com", password: "dias2026" };

// Datas relativas a hoje para a demo sempre parecer "viva"
function day(offset: number, time = "09:00"): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return time ? `${iso}T${time}` : iso;
}

const now = new Date().toISOString();

// Dados fictícios de exemplo; "Zerar dados" no painel apaga tudo
export function seedDatabase(): Database {
  return {
    agents: [
      {
        id: "ag-1",
        name: "Rafael Exemplo",
        rolePt: "Agente de proteção",
        roleEn: "Protection agent",
        bioPt: "Ex-militar com experiência em escolta de executivos e eventos.",
        bioEn: "Former military, experienced in executive escort and events.",
        languages: ["Português", "Inglês"],
        yearsExperience: 8,
        certifications: ["Curso de vigilante", "Primeiros socorros"],
        photoUrl: null,
        phone: "",
        documentId: "",
        notes: "",
        active: true,
        published: false,
        sortOrder: 1,
        createdAt: now,
      },
      {
        id: "ag-2",
        name: "Marcos Exemplo",
        rolePt: "Motorista bilíngue",
        roleEn: "Bilingual driver",
        bioPt: "Motorista executivo com direção defensiva e inglês fluente.",
        bioEn: "Executive driver, defensive driving, fluent English.",
        languages: ["Português", "Inglês", "Espanhol"],
        yearsExperience: 5,
        certifications: ["Direção defensiva"],
        photoUrl: null,
        phone: "",
        documentId: "",
        notes: "",
        active: true,
        published: false,
        sortOrder: 2,
        createdAt: now,
      },
    ],
    vehicles: [
      { id: "ve-1", categoryId: "suv", model: "SUV preta (exemplo)", plate: "ABC1D23", color: "Preto", year: 2023, owner: "own", partnerId: null, active: true, notes: "", published: false, photoUrl: null, descriptionPt: "SUV executiva com vidros escurecidos e bancos em couro.", descriptionEn: "Executive SUV with tinted windows and leather seats.", capacity: 4, armored: false, createdAt: now },
      { id: "ve-2", categoryId: "suv-blindado", model: "SUV blindada (exemplo)", plate: "", color: "Preto", year: 2022, owner: "partner", partnerId: "pa-1", active: true, notes: "Nível III-A", published: false, photoUrl: null, descriptionPt: "Blindagem nível III-A para deslocamentos sensíveis.", descriptionEn: "Level III-A armor for sensitive journeys.", capacity: 4, armored: true, createdAt: now },
      { id: "ve-3", categoryId: "sedan", model: "Sedã executivo (exemplo)", plate: "", color: "Prata", year: 2024, owner: "own", partnerId: null, active: true, notes: "", published: false, photoUrl: null, descriptionPt: "", descriptionEn: "", capacity: 3, armored: false, createdAt: now },
    ],
    clients: [
      { id: "cl-1", name: "Cliente Exemplo A", company: "Empresa Exemplo", phone: "", email: "", language: "en", notes: "Prefere atendimento em inglês.", createdAt: now },
      { id: "cl-2", name: "Cliente Exemplo B", company: "", phone: "", email: "", language: "pt", notes: "", createdAt: now },
      { id: "cl-3", name: "Hotel Exemplo", company: "Hotel Exemplo SP", phone: "", email: "", language: "pt", notes: "Indica hóspedes.", createdAt: now },
    ],
    partners: [
      { id: "pa-1", name: "Locadora Exemplo", kind: "Locadora de blindados", contact: "", phone: "", email: "", notes: "", createdAt: now },
      { id: "pa-2", name: "Agente freelancer (exemplo)", kind: "Freelancer", contact: "", phone: "", email: "", notes: "", createdAt: now },
    ],
    jobs: [
      { id: "jb-1", clientId: "cl-1", serviceTypeId: "transporte-executivo", startsAt: day(-12, "07:30"), endsAt: day(-12, "19:00"), origin: "Aeroporto de Guarulhos", destination: "Faria Lima", status: "done", price: 2800, paymentStatus: "paid", paidAt: day(-10, ""), notes: "", agentIds: ["ag-2"], vehicleIds: ["ve-1"], createdAt: now },
      { id: "jb-2", clientId: "cl-3", serviceTypeId: "protecao-executiva", startsAt: day(-4, "10:00"), endsAt: day(-4, "22:00"), origin: "Hotel Exemplo", destination: "Evento no Ibirapuera", status: "done", price: 6500, paymentStatus: "pending", paidAt: "", notes: "", agentIds: ["ag-1", "ag-2"], vehicleIds: ["ve-2"], createdAt: now },
      { id: "jb-3", clientId: "cl-2", serviceTypeId: "escolta-veicular", startsAt: day(3, "08:00"), endsAt: "", origin: "Morumbi", destination: "Campinas", status: "scheduled", price: 4200, paymentStatus: "pending", paidAt: "", notes: "", agentIds: ["ag-1"], vehicleIds: ["ve-1", "ve-3"], createdAt: now },
      { id: "jb-4", clientId: "cl-1", serviceTypeId: "eventos", startsAt: day(9, "18:00"), endsAt: "", origin: "", destination: "Jantar corporativo", status: "quote", price: 3500, paymentStatus: "pending", paidAt: "", notes: "Aguardando confirmação.", agentIds: [], vehicleIds: [], createdAt: now },
    ],
    jobCosts: [
      { id: "co-1", jobId: "jb-1", description: "Diária do motorista", category: "agent", amount: 600, agentId: "ag-2", partnerId: null, paid: true, createdAt: now },
      { id: "co-2", jobId: "jb-1", description: "Combustível", category: "fuel", amount: 180, agentId: null, partnerId: null, paid: true, createdAt: now },
      { id: "co-3", jobId: "jb-2", description: "Aluguel da blindada", category: "partner", amount: 1800, agentId: null, partnerId: "pa-1", paid: false, createdAt: now },
      { id: "co-4", jobId: "jb-2", description: "Diárias dos agentes", category: "agent", amount: 1400, agentId: null, partnerId: null, paid: false, createdAt: now },
      { id: "co-5", jobId: "jb-3", description: "Pedágios", category: "toll", amount: 95, agentId: null, partnerId: null, paid: false, createdAt: now },
    ],
    proposals: [
      {
        id: "pr-1",
        number: `${new Date().getFullYear()}-001`,
        clientId: "cl-1",
        jobId: "jb-4",
        title: "Segurança para jantar corporativo",
        status: "sent",
        issuedAt: day(-1, ""),
        validUntil: day(9, ""),
        serviceIds: ["eventos", "transporte-executivo"],
        summary:
          "Cobertura de segurança e logística para jantar corporativo com cerca de 40 convidados, incluindo recepção, controle de acesso e transporte executivo da diretoria.",
        period: `${new Date(Date.now() + 9 * 864e5).toLocaleDateString("pt-BR")}, das 18h às 23h`,
        location: "São Paulo · SP",
        items: [
          { id: "pi-1", description: "Agentes de segurança (desarmados)", detail: "2 agentes · até 6h", qty: 2, unit: "diária", unitPrice: 900 },
          { id: "pi-2", description: "Transfer executivo", detail: "SUV executivo com motorista bilíngue", qty: 2, unit: "transfer", unitPrice: 650 },
          { id: "pi-3", description: "Coordenação e advance do local", detail: "Visita técnica prévia e plano de contingência", qty: 1, unit: "un.", unitPrice: 400 },
        ],
        discount: 0,
        paymentTerms: "50% na confirmação e 50% até 2 dias úteis após o serviço. PIX ou transferência.",
        terms: DEFAULT_TERMS,
        notes: "Cliente pediu desconto; segurar o valor.",
        createdAt: now,
      },
      {
        id: "pr-2",
        number: `${new Date().getFullYear()}-002`,
        clientId: "cl-2",
        jobId: null,
        title: "Escolta veicular São Paulo → Campinas",
        status: "draft",
        issuedAt: day(0, ""),
        validUntil: day(10, ""),
        serviceIds: ["escolta-veicular"],
        summary: "Escolta veicular com veículo de apoio e dois agentes armados para deslocamento rodoviário com retorno no mesmo dia.",
        period: "A definir",
        location: "São Paulo → Campinas",
        items: [
          { id: "pi-4", description: "Veículo de apoio com 2 agentes armados", detail: "Ida e volta, até 12h", qty: 1, unit: "diária", unitPrice: 3200 },
          { id: "pi-5", description: "Pedágios e combustível", detail: "Estimativa, acerto no fechamento", qty: 1, unit: "un.", unitPrice: 350 },
        ],
        discount: 150,
        paymentTerms: "100% na confirmação. PIX ou transferência.",
        terms: DEFAULT_TERMS,
        notes: "",
        createdAt: now,
      },
    ],
    transactions: [
      { id: "tx-1", kind: "expense", description: "Seguro dos veículos", category: "Seguro", amount: 450, date: day(-6, ""), paid: true, createdAt: now },
      { id: "tx-2", kind: "expense", description: "Rádios (manutenção)", category: "Equipamento", amount: 220, date: day(-2, ""), paid: true, createdAt: now },
    ],
  };
}

export function emptyDatabase(): Database {
  return { agents: [], vehicles: [], clients: [], partners: [], jobs: [], jobCosts: [], transactions: [], proposals: [] };
}
