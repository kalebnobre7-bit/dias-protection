"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { requireSupabase } from "@/lib/supabase";

import {
  AGENT_COLUMNS,
  agentFromRow,
  agentToRow,
  CLIENT_COLUMNS,
  clientFromRow,
  clientToRow,
  JOB_COLUMNS,
  JOB_COST_COLUMNS,
  jobCostFromRow,
  jobCostToRow,
  jobFromRow,
  jobLinks,
  jobToRow,
  PARTNER_COLUMNS,
  partnerFromRow,
  partnerToRow,
  PROPOSAL_COLUMNS,
  PROPOSAL_ITEM_COLUMNS,
  proposalFromRow,
  proposalItemsToRows,
  proposalToRow,
  TABLES,
  TRANSACTION_COLUMNS,
  transactionFromRow,
  transactionToRow,
  VEHICLE_COLUMNS,
  vehicleFromRow,
  vehicleToRow,
  type AgentRow,
  type ClientRow,
  type JobAgentRow,
  type JobCostRow,
  type JobRow,
  type JobVehicleRow,
  type PartnerRow,
  type ProposalItemRow,
  type ProposalRow,
  type TransactionRow,
  type VehicleRow,
} from "./rows";
import type { Job, Proposal, TableName, Tables } from "./types";

// Repositório do painel sobre o Supabase (Postgres + RLS). A API é a mesma da Fase A
// (localStorage): as telas não mudaram. Cada tabela tem um cache em memória que é
// invalidado a cada gravação; useTable() recarrega quando isso acontece e quando a aba volta ao foco.

export const newId = () => crypto.randomUUID();

const listeners = new Set<(tables: TableName[]) => void>();
const cache = new Map<TableName, Promise<Tables[TableName][]>>();

// Erros de rede/RLS chegam aqui para o AdminShell mostrar um aviso (as telas não tratam todos)
const errorListeners = new Set<(message: string) => void>();
export function onStoreError(fn: (message: string) => void): () => void {
  errorListeners.add(fn);
  return () => errorListeners.delete(fn);
}

function fail(message: string): never {
  errorListeners.forEach((fn) => fn(message));
  throw new Error(message);
}

function invalidate(tables: TableName[]) {
  tables.forEach((t) => cache.delete(t));
  listeners.forEach((fn) => fn(tables));
}

type Result<T> = { data: T | null; error: { message: string; code?: string } | null };

function unwrap<T>(result: Result<T>, what: string): T {
  if (result.error) {
    const code = result.error.code ?? "";
    if (code === "23505") fail(`${what}: já existe um registro com esse número ou identificador.`);
    if (code === "23503") fail(`${what}: este registro ainda está ligado a outro. Marque como inativo em vez de excluir.`);
    if (code === "42501" || code === "PGRST301") fail(`${what}: sem permissão. Faça login de novo.`);
    fail(`${what}: ${result.error.message}`);
  }
  return result.data as T;
}

async function select<T>(client: SupabaseClient, table: string, columns: string, what: string): Promise<T[]> {
  const result = (await client.from(table).select(columns)) as Result<T[]>;
  return unwrap(result, what) ?? [];
}

async function fetchTable<T extends TableName>(table: T): Promise<Tables[T][]> {
  const client = requireSupabase();
  const what = "Não foi possível carregar os dados";
  switch (table) {
    case "agents":
      return (await select<AgentRow>(client, TABLES.agents, AGENT_COLUMNS, what)).map(agentFromRow) as Tables[T][];
    case "vehicles":
      return (await select<VehicleRow>(client, TABLES.vehicles, VEHICLE_COLUMNS, what)).map(vehicleFromRow) as Tables[T][];
    case "clients":
      return (await select<ClientRow>(client, TABLES.clients, CLIENT_COLUMNS, what)).map(clientFromRow) as Tables[T][];
    case "partners":
      return (await select<PartnerRow>(client, TABLES.partners, PARTNER_COLUMNS, what)).map(partnerFromRow) as Tables[T][];
    case "jobCosts":
      return (await select<JobCostRow>(client, TABLES.jobCosts, JOB_COST_COLUMNS, what)).map(jobCostFromRow) as Tables[T][];
    case "transactions":
      return (await select<TransactionRow>(client, TABLES.transactions, TRANSACTION_COLUMNS, what)).map(transactionFromRow) as Tables[T][];
    case "jobs": {
      const [rows, agents, vehicles] = await Promise.all([
        select<JobRow>(client, TABLES.jobs, JOB_COLUMNS, what),
        select<JobAgentRow>(client, "job_agents", "job_id, agent_id", what),
        select<JobVehicleRow>(client, "job_vehicles", "job_id, vehicle_id", what),
      ]);
      return rows.map((r) =>
        jobFromRow(
          r,
          agents.filter((a) => a.job_id === r.id).map((a) => a.agent_id),
          vehicles.filter((v) => v.job_id === r.id).map((v) => v.vehicle_id),
        ),
      ) as Tables[T][];
    }
    case "proposals": {
      const [rows, items] = await Promise.all([
        select<ProposalRow>(client, TABLES.proposals, PROPOSAL_COLUMNS, what),
        select<ProposalItemRow>(client, "proposal_items", PROPOSAL_ITEM_COLUMNS, what),
      ]);
      return rows.map((r) =>
        proposalFromRow(
          r,
          items.filter((i) => i.proposal_id === r.id),
        ),
      ) as Tables[T][];
    }
  }
  return [];
}

async function upsertRows(client: SupabaseClient, table: string, rows: object[], what: string) {
  if (!rows.length) return;
  unwrap((await client.from(table).upsert(rows)) as Result<unknown>, what);
}

async function deleteWhere(client: SupabaseClient, table: string, column: string, value: string, what: string, notIn?: string[]) {
  let q = client.from(table).delete().eq(column, value);
  if (notIn && notIn.length) q = q.not("id", "in", `(${notIn.join(",")})`);
  unwrap((await q) as Result<unknown>, what);
}

async function saveJob(client: SupabaseClient, job: Job) {
  const what = "Não foi possível salvar o serviço";
  await upsertRows(client, TABLES.jobs, [jobToRow(job)], what);
  const links = jobLinks(job);
  await deleteWhere(client, "job_agents", "job_id", job.id, what);
  await deleteWhere(client, "job_vehicles", "job_id", job.id, what);
  await upsertRows(client, "job_agents", links.agents, what);
  await upsertRows(client, "job_vehicles", links.vehicles, what);
}

async function saveProposal(client: SupabaseClient, proposal: Proposal) {
  const what = "Não foi possível salvar a proposta";
  await upsertRows(client, TABLES.proposals, [proposalToRow(proposal)], what);
  const items = proposalItemsToRows(proposal);
  await deleteWhere(
    client,
    "proposal_items",
    "proposal_id",
    proposal.id,
    what,
    items.map((i) => i.id),
  );
  await upsertRows(client, "proposal_items", items, what);
}

// Mesmas mensagens da Fase A para agente/veículo em uso (o banco também bloqueia: on delete restrict)
async function checkRemove(client: SupabaseClient, table: TableName, id: string) {
  const link =
    table === "agents"
      ? { table: "job_agents", column: "agent_id" }
      : table === "vehicles"
        ? { table: "job_vehicles", column: "vehicle_id" }
        : null;
  if (!link) return;
  const { count } = await client.from(link.table).select("job_id", { count: "exact", head: true }).eq(link.column, id);
  if (count) {
    const noun = table === "agents" ? "Este agente" : "Este veículo";
    fail(`${noun} está em ${count} serviço(s). Marque como inativo em vez de excluir.`);
  }
}

// Tabelas afetadas por uma gravação (FKs com cascade / set null)
const related: Record<TableName, TableName[]> = {
  agents: ["agents", "jobCosts"],
  vehicles: ["vehicles"],
  clients: ["clients", "jobs", "proposals"],
  partners: ["partners", "vehicles", "jobCosts"],
  jobs: ["jobs", "jobCosts", "proposals"],
  jobCosts: ["jobCosts"],
  transactions: ["transactions"],
  proposals: ["proposals"],
};

export const repo = {
  async list<T extends TableName>(table: T): Promise<Tables[T][]> {
    let pending = cache.get(table) as Promise<Tables[T][]> | undefined;
    if (!pending) {
      pending = fetchTable(table);
      cache.set(table, pending);
      pending.catch(() => cache.delete(table));
    }
    return pending;
  },

  async upsert<T extends TableName>(table: T, row: Tables[T]): Promise<Tables[T]> {
    const client = requireSupabase();
    const what = "Não foi possível salvar";
    switch (table) {
      case "agents":
        await upsertRows(client, TABLES.agents, [agentToRow(row as Tables["agents"])], what);
        break;
      case "vehicles":
        await upsertRows(client, TABLES.vehicles, [vehicleToRow(row as Tables["vehicles"])], what);
        break;
      case "clients":
        await upsertRows(client, TABLES.clients, [clientToRow(row as Tables["clients"])], what);
        break;
      case "partners":
        await upsertRows(client, TABLES.partners, [partnerToRow(row as Tables["partners"])], what);
        break;
      case "jobCosts":
        await upsertRows(client, TABLES.jobCosts, [jobCostToRow(row as Tables["jobCosts"])], what);
        break;
      case "transactions":
        await upsertRows(client, TABLES.transactions, [transactionToRow(row as Tables["transactions"])], what);
        break;
      case "jobs":
        await saveJob(client, row as Tables["jobs"]);
        break;
      case "proposals":
        await saveProposal(client, row as Tables["proposals"]);
        break;
    }
    invalidate(related[table]);
    return row;
  },

  async remove(table: TableName, id: string): Promise<void> {
    const client = requireSupabase();
    await checkRemove(client, table, id);
    await deleteWhere(client, TABLES[table], "id", id, "Não foi possível excluir");
    invalidate(related[table]);
  },

  // Troca a lista de custos de um serviço de uma vez (salvar do formulário)
  async replaceJobCosts(jobId: string, costs: Tables["jobCosts"][]): Promise<void> {
    const client = requireSupabase();
    const what = "Não foi possível salvar os custos";
    await deleteWhere(
      client,
      TABLES.jobCosts,
      "job_id",
      jobId,
      what,
      costs.map((c) => c.id),
    );
    await upsertRows(client, TABLES.jobCosts, costs.map(jobCostToRow), what);
    invalidate(["jobCosts"]);
  },

  // Apaga tudo (os vínculos e itens caem por cascade). Fotos no Storage ficam.
  async reset(): Promise<void> {
    const client = requireSupabase();
    const what = "Não foi possível apagar";
    for (const table of ["proposals", "jobs", "transactions", "vehicles", "agents", "clients", "partners"] as const) {
      unwrap((await client.from(TABLES[table]).delete().not("id", "is", null)) as Result<unknown>, what);
    }
    invalidate(Object.keys(related) as TableName[]);
  },

  // Recarrega tudo do servidor (depois de importar dados)
  refresh(): void {
    invalidate(Object.keys(related) as TableName[]);
  },
};

// Lê uma tabela e se atualiza sozinho quando qualquer gravação acontece
export function useTable<T extends TableName>(table: T): { rows: Tables[T][]; loading: boolean } {
  const [rows, setRows] = useState<Tables[T][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      repo
        .list(table)
        .then((r) => {
          if (!alive) return;
          setRows(r);
          setLoading(false);
        })
        .catch(() => alive && setLoading(false));
    load();
    const onChange = (tables: TableName[]) => tables.includes(table) && load();
    listeners.add(onChange);
    // Voltou para a aba (ou outro aparelho gravou): busca de novo
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        cache.delete(table);
        load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      listeners.delete(onChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [table]);

  return { rows, loading };
}
