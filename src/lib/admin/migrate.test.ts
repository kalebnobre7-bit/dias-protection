import { describe, expect, it } from "vitest";

import { countRows, emptyDatabase, isUuid, LEGACY_KEY, normalizeDatabase, readLegacy } from "./migrate";

// Formato do localStorage da Fase A: ids de exemplo curtos e referências entre tabelas
const legacy = {
  agents: [{ id: "ag-1", name: "Rafael" }],
  vehicles: [{ id: "ve-1", model: "SW4", owner: "partner", partnerId: "pa-1" }],
  clients: [{ id: "cl-1", name: "Ana" }],
  partners: [{ id: "pa-1", name: "Locadora" }],
  jobs: [{ id: "jb-1", clientId: "cl-1", agentIds: ["ag-1", "ag-9"], vehicleIds: ["ve-1"] }],
  jobCosts: [
    { id: "co-1", jobId: "jb-1", agentId: "ag-1", partnerId: null },
    { id: "co-2", jobId: "jb-404", agentId: null, partnerId: null },
  ],
  transactions: [{ id: "tx-1", kind: "expense" }],
  proposals: [{ id: "pr-1", clientId: "cl-1", jobId: "jb-1", items: [{ id: "pr-1-1", description: "Agente" }] }],
};

const sequential = () => {
  let n = 0;
  return () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
};

describe("normalizeDatabase", () => {
  it("troca ids de exemplo por UUID e mantém as referências apontando certo", () => {
    const db = normalizeDatabase(legacy, sequential());
    const agent = db.agents[0];
    const vehicle = db.vehicles[0];
    const partner = db.partners[0];
    const client = db.clients[0];
    const job = db.jobs[0];
    expect([agent.id, vehicle.id, partner.id, client.id, job.id].every(isUuid)).toBe(true);
    expect(vehicle.partnerId).toBe(partner.id);
    expect(job.clientId).toBe(client.id);
    expect(job.vehicleIds).toEqual([vehicle.id]);
    expect(db.proposals[0].clientId).toBe(client.id);
    expect(db.proposals[0].jobId).toBe(job.id);
    expect(isUuid(db.proposals[0].items[0].id)).toBe(true);
  });

  it("descarta referências órfãs em vez de violar as FKs", () => {
    const db = normalizeDatabase(legacy, sequential());
    expect(db.jobs[0].agentIds).toEqual([db.agents[0].id]); // ag-9 não existe
    expect(db.jobCosts).toHaveLength(1); // co-2 apontava para jb-404
    expect(db.jobCosts[0].agentId).toBe(db.agents[0].id);
  });

  it("mantém UUIDs que já existem e aceita tabelas faltando", () => {
    const id = "0b9f1c2e-1111-4c0a-9d2b-000000000001";
    const db = normalizeDatabase({ clients: [{ id, name: "Ana" }], jobs: "não é lista" });
    expect(db.clients[0].id).toBe(id);
    expect(db.jobs).toEqual([]);
    expect(countRows(db)).toBe(1);
    expect(countRows(emptyDatabase())).toBe(0);
  });
});

describe("readLegacy", () => {
  const storage = (value: string | null) => ({ getItem: (key: string) => (key === LEGACY_KEY ? value : null) });

  it("devolve null sem dados ou com JSON corrompido", () => {
    expect(readLegacy(storage(null))).toBeNull();
    expect(readLegacy(storage("{nope"))).toBeNull();
  });

  it("lê e normaliza o que estava no navegador", () => {
    const db = readLegacy(storage(JSON.stringify(legacy)));
    expect(db?.agents[0].name).toBe("Rafael");
    expect(isUuid(db?.agents[0].id)).toBe(true);
  });
});
