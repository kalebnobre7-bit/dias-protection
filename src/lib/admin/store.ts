"use client";

import type { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { getBrowserClient } from "@/lib/supabase";

import type { Job, Proposal, ProposalItem, TableName, Tables } from "./types";

// Repositório do painel sobre o Supabase. As telas só usam `repo.*` e `useTable`;
// aqui o camelCase dos tipos vira snake_case das tabelas e o contrário.

type Row = Record<string, unknown>;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export const newId = () => crypto.randomUUID();

const dbTable = (table: TableName) => (table === "jobCosts" || table === "financeCategories" ? snake(table) : table);

const snake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

// Campos que o tipo declara como `| null`; os demais textos usam "" no lugar de null
const NULLABLE = new Set([
  "photoUrl", "cnhUrl", "yearsExperience", "categoryId", "partnerId", "clientId",
  "serviceTypeId", "language", "jobId", "agentId", "capacity", "year", "pricing",
]);
// Colunas de data/hora que não aceitam "" (vão como null)
const OPTIONAL_DATES = new Set(["endsAt", "paidAt"]);

// "YYYY-MM-DDTHH:mm" local ↔ timestamptz
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocalInput = (local: string) => new Date(local).toISOString();

function toRow(table: TableName, obj: object): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(obj)) {
    if (table === "jobs" && (k === "agentIds" || k === "vehicleIds")) continue; // vão para job_agents / job_vehicles
    if (table === "proposals" && k === "items") continue; // vai para proposal_items
    if (table === "jobs" && k === "startsAt") out.starts_at = fromLocalInput(v as string);
    else if (table === "jobs" && k === "endsAt") out.ends_at = v ? fromLocalInput(v as string) : null;
    else if (OPTIONAL_DATES.has(k)) out[snake(k)] = v || null;
    else out[snake(k)] = v;
  }
  return out;
}

function fromRow(row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    const key = camel(k);
    out[key] = v === null && !NULLABLE.has(key) ? "" : v;
  }
  return out;
}

function friendly(table: TableName, error: PostgrestError): Error {
  if (error.code === "23503" && table === "agents") return new Error("Este agente está em algum serviço. Marque como inativo em vez de excluir.");
  if (error.code === "23503" && table === "vehicles") return new Error("Este veículo está em algum serviço. Marque como inativo em vez de excluir.");
  if (error.code === "23505") return new Error("Já existe um registro com esse valor (número repetido).");
  return new Error(error.message);
}

const SELECT: Partial<Record<TableName, string>> = {
  jobs: "*, job_agents(agent_id), job_vehicles(vehicle_id)",
  proposals: "*, proposal_items(*)",
};

function parse<T extends TableName>(table: T, raw: Row): Tables[T] {
  if (table === "jobs") {
    const { jobAgents, jobVehicles, ...job } = fromRow(raw);
    return {
      ...job,
      startsAt: toLocalInput(job.startsAt as string),
      endsAt: job.endsAt ? toLocalInput(job.endsAt as string) : "",
      agentIds: (jobAgents as { agent_id: string }[]).map((r) => r.agent_id),
      vehicleIds: (jobVehicles as { vehicle_id: string }[]).map((r) => r.vehicle_id),
    } as Tables[T];
  }
  if (table === "proposals") {
    const { proposalItems, ...proposal } = fromRow(raw);
    const items = (proposalItems as Row[])
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map((i): ProposalItem => ({
        id: i.id as string,
        description: i.description as string,
        detail: (i.detail as string) ?? "",
        qty: Number(i.qty),
        unit: i.unit as string,
        unitPrice: Number(i.unit_price),
      }));
    return { ...proposal, items } as Tables[T];
  }
  return fromRow(raw) as Tables[T];
}

async function check<T>(table: TableName, query: PromiseLike<{ data: T; error: PostgrestError | null }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw friendly(table, error);
  return data;
}

// Troca os vínculos de um serviço (equipe e veículos) ou os itens de uma proposta
async function syncChildren(table: "jobs" | "proposals", row: Job | Proposal) {
  const sb = getBrowserClient();
  if (table === "jobs") {
    const job = row as Job;
    await check("jobs", sb.from("job_agents").delete().eq("job_id", job.id));
    await check("jobs", sb.from("job_vehicles").delete().eq("job_id", job.id));
    if (job.agentIds.length) await check("jobs", sb.from("job_agents").insert(job.agentIds.map((agent_id) => ({ job_id: job.id, agent_id }))));
    if (job.vehicleIds.length) await check("jobs", sb.from("job_vehicles").insert(job.vehicleIds.map((vehicle_id) => ({ job_id: job.id, vehicle_id }))));
    return;
  }
  const proposal = row as Proposal;
  await check("proposals", sb.from("proposal_items").delete().eq("proposal_id", proposal.id));
  if (proposal.items.length) {
    await check(
      "proposals",
      sb.from("proposal_items").insert(
        proposal.items.map((i, sort_order) => ({
          proposal_id: proposal.id, description: i.description, detail: i.detail,
          qty: i.qty, unit: i.unit, unit_price: i.unitPrice, sort_order,
        })),
      ),
    );
  }
}

// Gravações em andamento: as janelas travam os botões enquanto houver alguma (evita duplicar no toque duplo).
// A liberação espera um pouco para cobrir o intervalo entre gravações em sequência (cliente → proposta → itens).
let pending = 0;
const savingListeners = new Set<(busy: boolean) => void>();
async function tracked<T>(work: () => Promise<T>): Promise<T> {
  if (pending++ === 0) savingListeners.forEach((fn) => fn(true));
  try {
    return await work();
  } finally {
    setTimeout(() => --pending === 0 && savingListeners.forEach((fn) => fn(false)), 150);
  }
}

export function useSaving(): boolean {
  const [busy, setBusy] = useState(pending > 0);
  useEffect(() => {
    savingListeners.add(setBusy);
    return () => {
      savingListeners.delete(setBusy);
    };
  }, []);
  return busy;
}

export const repo = {
  async list<T extends TableName>(table: T): Promise<Tables[T][]> {
    const rows = await check(
      table,
      getBrowserClient().from(dbTable(table)).select(SELECT[table] ?? "*").order("created_at", { ascending: true }),
    );
    return (rows as unknown as Row[]).map((r) => parse(table, r));
  },

  upsert<T extends TableName>(table: T, row: Tables[T]): Promise<Tables[T]> {
    return tracked(async () => {
      await check(table, getBrowserClient().from(dbTable(table)).upsert(toRow(table, row)));
      if (table === "jobs" || table === "proposals") await syncChildren(table, row as Job | Proposal);
      notify();
      return row;
    });
  },

  remove(table: TableName, id: string): Promise<void> {
    return tracked(async () => {
      await check(table, getBrowserClient().from(dbTable(table)).delete().eq("id", id));
      notify();
    });
  },

  // Categoria de custo renomeada em Configurações: leva junto os custos já lançados
  renameCostCategory(from: string, to: string): Promise<void> {
    return tracked(async () => {
      await check("jobCosts", getBrowserClient().from("job_costs").update({ category: to }).eq("category", from));
      notify();
    });
  },

  // Troca a lista de custos de um serviço de uma vez (salvar do formulário)
  replaceJobCosts(jobId: string, costs: Tables["jobCosts"][]): Promise<void> {
    return tracked(async () => {
      const sb = getBrowserClient();
      await check("jobCosts", sb.from("job_costs").delete().eq("job_id", jobId));
      if (costs.length) await check("jobCosts", sb.from("job_costs").insert(costs.map((c) => toRow("jobCosts", c))));
      notify();
    });
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
        .then((r) => alive && setRows(r))
        .catch(() => undefined) // sem sessão ou sem rede: mantém o que já tinha
        .finally(() => alive && setLoading(false));
    load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
    };
  }, [table]);

  return { rows, loading };
}
