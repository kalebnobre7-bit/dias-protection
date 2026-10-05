import { describe, expect, it } from "vitest";

import {
  agentFromRow,
  agentToRow,
  clientFromRow,
  clientToRow,
  isoToLocal,
  jobCostFromRow,
  jobCostToRow,
  jobFromRow,
  jobLinks,
  jobToRow,
  localToIso,
  partnerFromRow,
  partnerToRow,
  proposalFromRow,
  proposalItemsToRows,
  proposalToRow,
  transactionFromRow,
  transactionToRow,
  vehicleFromRow,
  vehicleToRow,
} from "./rows";
import type { AgentRecord, Client, Job, JobCost, Partner, Proposal, Transaction, Vehicle } from "./types";

const agent: AgentRecord = {
  id: "0b9f1c2e-1111-4c0a-9d2b-000000000001",
  name: "Rafael",
  rolePt: "Agente",
  roleEn: "Agent",
  bioPt: "bio",
  bioEn: "",
  languages: ["Português", "Inglês"],
  yearsExperience: 8,
  certifications: ["Vigilante"],
  photoUrl: null,
  phone: "",
  documentId: "123",
  notes: "",
  active: true,
  published: false,
  sortOrder: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const vehicle: Vehicle = {
  id: "0b9f1c2e-1111-4c0a-9d2b-000000000002",
  categoryId: "suv",
  model: "SW4",
  plate: "",
  color: "Preto",
  year: 2023,
  owner: "own",
  partnerId: "0b9f1c2e-1111-4c0a-9d2b-000000000009",
  active: true,
  notes: "",
  published: true,
  photoUrl: "https://x/y.jpg",
  descriptionPt: "desc",
  descriptionEn: "",
  capacity: 4,
  armored: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const client: Client = {
  id: "0b9f1c2e-1111-4c0a-9d2b-000000000003",
  name: "Ana",
  company: "",
  phone: "11 9",
  email: "",
  language: "en",
  notes: "",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const partner: Partner = {
  id: "0b9f1c2e-1111-4c0a-9d2b-000000000004",
  name: "Locadora",
  kind: "Locadora",
  contact: "",
  phone: "",
  email: "a@b.c",
  notes: "",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const job: Job = {
  id: "0b9f1c2e-1111-4c0a-9d2b-000000000005",
  clientId: client.id,
  serviceTypeId: "escolta-veicular",
  startsAt: "2026-10-05T09:30",
  endsAt: "",
  origin: "GRU",
  destination: "",
  status: "scheduled",
  price: 3500.5,
  paymentStatus: "pending",
  paidAt: "",
  notes: "",
  agentIds: [agent.id, agent.id],
  vehicleIds: [vehicle.id],
  createdAt: "2026-01-01T00:00:00.000Z",
};

const cost: JobCost = {
  id: "0b9f1c2e-1111-4c0a-9d2b-000000000006",
  jobId: job.id,
  description: "Pedágio",
  category: "toll",
  amount: 42.9,
  agentId: null,
  partnerId: null,
  paid: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const tx: Transaction = {
  id: "0b9f1c2e-1111-4c0a-9d2b-000000000007",
  kind: "expense",
  description: "Rádio",
  category: "",
  amount: 199,
  date: "2026-10-02",
  paid: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const proposal: Proposal = {
  id: "0b9f1c2e-1111-4c0a-9d2b-000000000008",
  number: "2026-003",
  clientId: client.id,
  jobId: null,
  title: "Escolta",
  status: "sent",
  issuedAt: "2026-10-01",
  validUntil: "2026-10-11",
  serviceIds: ["escolta-veicular"],
  summary: "",
  period: "",
  location: "SP",
  items: [
    { id: "0b9f1c2e-1111-4c0a-9d2b-00000000000a", description: "Agente", detail: "", qty: 2, unit: "diária", unitPrice: 800 },
    { id: "0b9f1c2e-1111-4c0a-9d2b-00000000000b", description: "SUV", detail: "12h", qty: 1, unit: "diária", unitPrice: 1500 },
  ],
  discount: 100,
  paymentTerms: "50/50",
  terms: "",
  notes: "interno",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("datas", () => {
  it("local ↔ ISO é reversível no fuso de quem usa o painel", () => {
    const iso = localToIso("2026-10-05T09:30");
    expect(iso).toMatch(/Z$/);
    expect(isoToLocal(iso)).toBe("2026-10-05T09:30");
    expect(localToIso("")).toBeNull();
    expect(localToIso("não é data")).toBeNull();
    expect(isoToLocal(null)).toBe("");
  });
});

describe("mapeadores ida e volta", () => {
  it("agente: '' vira null nas colunas internas e volta como ''", () => {
    const row = agentToRow(agent);
    expect(row.phone).toBeNull();
    expect(row.document_id).toBe("123");
    expect(row.role_pt).toBe("Agente");
    expect(agentFromRow(row)).toEqual(agent);
  });

  it("veículo: partner_id só vai quando o dono é parceiro", () => {
    expect(vehicleToRow(vehicle).partner_id).toBeNull();
    expect(vehicleToRow({ ...vehicle, owner: "partner" }).partner_id).toBe(vehicle.partnerId);
    expect(vehicleFromRow(vehicleToRow(vehicle))).toEqual({ ...vehicle, partnerId: null });
  });

  it("cliente e parceiro", () => {
    expect(clientFromRow(clientToRow(client))).toEqual(client);
    expect(partnerFromRow(partnerToRow(partner))).toEqual(partner);
    expect(clientFromRow({ ...clientToRow(client), language: "xx" as never }).language).toBeNull();
  });

  it("serviço: data local vira timestamptz, vínculos sem repetição, numeric volta como número", () => {
    const row = jobToRow(job);
    expect(row.starts_at).toBe(localToIso("2026-10-05T09:30"));
    expect(row.ends_at).toBeNull();
    expect(row.paid_at).toBeNull();
    const links = jobLinks(job);
    expect(links.agents).toEqual([{ job_id: job.id, agent_id: agent.id }]);
    expect(links.vehicles).toEqual([{ job_id: job.id, vehicle_id: vehicle.id }]);
    // PostgREST devolve numeric como string
    const back = jobFromRow({ ...row, price: "3500.50" }, [agent.id], [vehicle.id]);
    expect(back).toEqual({ ...job, agentIds: [agent.id] });
    expect(jobFromRow({ ...row, status: "weird" as never }).status).toBe("scheduled");
  });

  it("custo e lançamento", () => {
    expect(jobCostFromRow({ ...jobCostToRow(cost), amount: "42.90" })).toEqual(cost);
    expect(transactionToRow(tx).category).toBe("other");
    expect(transactionFromRow({ ...transactionToRow(tx), amount: "199" })).toEqual({ ...tx, category: "other" });
  });

  it("proposta: itens viram linhas ordenadas e voltam na mesma ordem", () => {
    const items = proposalItemsToRows(proposal);
    expect(items.map((i) => i.sort_order)).toEqual([0, 1]);
    expect(items[1]).toMatchObject({ proposal_id: proposal.id, unit_price: 1500, qty: 1 });
    const back = proposalFromRow({ ...proposalToRow(proposal), discount: "100.00" }, [
      { ...items[1], qty: "1.00", unit_price: "1500.00" },
      { ...items[0], qty: "2.00", unit_price: "800.00" },
    ]);
    expect(back).toEqual(proposal);
  });

  it("linhas incompletas não quebram o painel", () => {
    expect(agentFromRow({ id: "x" }).languages).toEqual([]);
    expect(jobFromRow({ id: "x" }).price).toBe(0);
    expect(proposalFromRow({ id: "x" }).items).toEqual([]);
  });
});
