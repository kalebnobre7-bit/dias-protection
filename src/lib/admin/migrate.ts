import type { SupabaseClient } from "@supabase/supabase-js";

// Extensão .ts explícita: o Node (scripts/import-json.mjs, --experimental-strip-types) não adivinha extensão
import { ensureStoredPhoto } from "./photos.ts";
import {
  agentToRow,
  clientToRow,
  jobCostToRow,
  jobLinks,
  jobToRow,
  partnerToRow,
  proposalItemsToRows,
  proposalToRow,
  TABLES,
  transactionToRow,
  vehicleToRow,
} from "./rows.ts";
import type { Database, TableName } from "./types";

// Migração do painel da Fase A (localStorage) para o Supabase.
// 1. exportLegacy(): lê o que ainda está no navegador e devolve o JSON
// 2. normalizeDatabase(): ids de exemplo ("ag-1") viram UUID, com as referências acompanhando
// 3. importDatabase(): grava na ordem das FKs e manda as fotos em data URL para o Storage
// Só imports relativos: scripts/import-json.mjs roda isto no Node.

export const LEGACY_KEY = "dias-admin:db:v1";

export const TABLE_NAMES: TableName[] = ["agents", "vehicles", "clients", "partners", "jobs", "jobCosts", "transactions", "proposals"];

export function emptyDatabase(): Database {
  return { agents: [], vehicles: [], clients: [], partners: [], jobs: [], jobCosts: [], transactions: [], proposals: [] };
}

export function readLegacy(storage: Pick<Storage, "getItem">): Database | null {
  const raw = storage.getItem(LEGACY_KEY);
  if (!raw) return null;
  try {
    return normalizeDatabase(JSON.parse(raw));
  } catch {
    return null;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

type Rows = Record<string, unknown>[];
const rowsOf = (raw: unknown, table: TableName): Rows => {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>)[table] : null;
  return Array.isArray(value) ? value.filter((r): r is Record<string, unknown> => !!r && typeof r === "object") : [];
};

// Aceita o JSON exportado (ou o localStorage cru) e devolve um Database com ids válidos.
// `randomId` só existe para os testes serem determinísticos.
export function normalizeDatabase(raw: unknown, randomId: () => string = () => crypto.randomUUID()): Database {
  const tables = Object.fromEntries(TABLE_NAMES.map((t) => [t, rowsOf(raw, t)])) as Record<TableName, Rows>;

  // Ids antigos → novos, por tabela (ids de exemplo da Fase A não eram UUID)
  const ids = new Map<string, string>();
  const remap = (id: unknown): string => {
    if (typeof id !== "string" || id === "") return randomId();
    if (isUuid(id)) return id;
    let next = ids.get(id);
    if (!next) {
      next = randomId();
      ids.set(id, next);
    }
    return next;
  };
  const ref = (id: unknown): string | null => (typeof id === "string" && id !== "" ? remap(id) : null);
  const refs = (list: unknown): string[] => (Array.isArray(list) ? list.map(remap) : []);

  // Primeiro todos os ids próprios, depois as referências (evita UUID novo para referência órfã)
  for (const t of TABLE_NAMES) tables[t].forEach((r) => (r.id = remap(r.id)));
  for (const p of tables.proposals) {
    if (Array.isArray(p.items))
      p.items.forEach((i) => i && typeof i === "object" && ((i as Record<string, unknown>).id = remap((i as Record<string, unknown>).id)));
  }

  const known = (t: TableName) => new Set(tables[t].map((r) => r.id as string));
  const agents = known("agents");
  const vehicles = known("vehicles");
  const clients = known("clients");
  const partners = known("partners");
  const jobs = known("jobs");
  const only = (set: Set<string>) => (id: string | null) => (id && set.has(id) ? id : null);

  tables.vehicles.forEach((v) => (v.partnerId = only(partners)(ref(v.partnerId))));
  tables.jobs.forEach((j) => {
    j.clientId = only(clients)(ref(j.clientId));
    j.agentIds = refs(j.agentIds).filter((id) => agents.has(id));
    j.vehicleIds = refs(j.vehicleIds).filter((id) => vehicles.has(id));
  });
  tables.jobCosts.forEach((c) => {
    c.jobId = ref(c.jobId);
    c.agentId = only(agents)(ref(c.agentId));
    c.partnerId = only(partners)(ref(c.partnerId));
  });
  tables.jobCosts = tables.jobCosts.filter((c) => typeof c.jobId === "string" && jobs.has(c.jobId));
  tables.proposals.forEach((p) => {
    p.clientId = only(clients)(ref(p.clientId));
    p.jobId = only(jobs)(ref(p.jobId));
  });

  return tables as unknown as Database;
}

export type ImportProgress = { step: string; done: number; total: number };

// Grava tudo no Supabase com upsert (pode rodar de novo sem duplicar). Fotos em data URL vão para o Storage.
export async function importDatabase(client: SupabaseClient, db: Database, onProgress?: (p: ImportProgress) => void): Promise<void> {
  const steps = 10;
  let step = 0;
  const report = (label: string) => onProgress?.({ step: label, done: ++step, total: steps });

  const put = async (table: string, rows: object[]) => {
    if (!rows.length) return;
    const { error } = await client.from(table).upsert(rows);
    if (error) throw new Error(`${table}: ${error.message}`);
  };

  report("Fotos dos agentes");
  const agents = await Promise.all(
    db.agents.map(async (a) => ({ ...a, photoUrl: await ensureStoredPhoto(client, "agents", a.id, a.photoUrl) })),
  );
  report("Fotos dos veículos");
  const vehicles = await Promise.all(
    db.vehicles.map(async (v) => ({ ...v, photoUrl: await ensureStoredPhoto(client, "vehicles", v.id, v.photoUrl) })),
  );

  report("Parceiros");
  await put(TABLES.partners, db.partners.map(partnerToRow));
  report("Clientes");
  await put(TABLES.clients, db.clients.map(clientToRow));
  report("Agentes");
  await put(TABLES.agents, agents.map(agentToRow));
  report("Veículos");
  await put(TABLES.vehicles, vehicles.map(vehicleToRow));
  report("Serviços");
  await put(TABLES.jobs, db.jobs.map(jobToRow));
  await put(
    "job_agents",
    db.jobs.flatMap((j) => jobLinks(j).agents),
  );
  await put(
    "job_vehicles",
    db.jobs.flatMap((j) => jobLinks(j).vehicles),
  );
  report("Custos");
  await put(TABLES.jobCosts, db.jobCosts.map(jobCostToRow));
  report("Lançamentos");
  await put(TABLES.transactions, db.transactions.map(transactionToRow));
  report("Propostas");
  await put(TABLES.proposals, db.proposals.map(proposalToRow));
  await put("proposal_items", db.proposals.flatMap(proposalItemsToRows));
}

export function countRows(db: Database): number {
  return TABLE_NAMES.reduce((n, t) => n + db[t].length, 0);
}
