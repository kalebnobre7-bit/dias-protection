"use client";

import { useEffect, useState } from "react";

import { emptyDatabase, seedDatabase } from "./seed";
import type { Database, TableName, Tables } from "./types";

// Repositório do painel. Hoje grava no localStorage deste navegador.
// Na Fase B, só este arquivo muda: cada função vira uma chamada ao Supabase
// (a API já é assíncrona para a troca não afetar as telas).

const KEY = "dias-admin:db:v1";
const listeners = new Set<() => void>();

function read(): Database {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyDatabase(), ...(JSON.parse(raw) as Partial<Database>) };
  } catch {
    // storage bloqueado ou corrompido: cai nos dados de exemplo
  }
  const db = seedDatabase();
  write(db);
  return db;
}

function write(db: Database) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    throw new Error("Não foi possível salvar neste navegador (espaço cheio ou bloqueado).");
  }
  listeners.forEach((fn) => fn());
}

export const newId = () => crypto.randomUUID();

// Mesmas regras de exclusão das foreign keys da migration
function checkRemove(db: Database, table: TableName, id: string) {
  if (table === "agents") {
    const n = db.jobs.filter((j) => j.agentIds.includes(id)).length;
    if (n) throw new Error(`Este agente está em ${n} serviço(s). Marque como inativo em vez de excluir.`);
  }
  if (table === "vehicles") {
    const n = db.jobs.filter((j) => j.vehicleIds.includes(id)).length;
    if (n) throw new Error(`Este veículo está em ${n} serviço(s). Marque como inativo em vez de excluir.`);
  }
}

function cascade(db: Database, table: TableName, id: string): Database {
  switch (table) {
    case "jobs":
      return { ...db, jobCosts: db.jobCosts.filter((c) => c.jobId !== id) };
    case "clients":
      return { ...db, jobs: db.jobs.map((j) => (j.clientId === id ? { ...j, clientId: null } : j)) };
    case "partners":
      return {
        ...db,
        vehicles: db.vehicles.map((v) => (v.partnerId === id ? { ...v, partnerId: null } : v)),
        jobCosts: db.jobCosts.map((c) => (c.partnerId === id ? { ...c, partnerId: null } : c)),
      };
    case "agents":
      return { ...db, jobCosts: db.jobCosts.map((c) => (c.agentId === id ? { ...c, agentId: null } : c)) };
    default:
      return db;
  }
}

export const repo = {
  async list<T extends TableName>(table: T): Promise<Tables[T][]> {
    return read()[table];
  },

  async upsert<T extends TableName>(table: T, row: Tables[T]): Promise<Tables[T]> {
    const db = read();
    const rows = db[table] as Tables[T][];
    const exists = rows.some((r) => r.id === row.id);
    const next = exists ? rows.map((r) => (r.id === row.id ? row : r)) : [...rows, row];
    write({ ...db, [table]: next });
    return row;
  },

  async remove(table: TableName, id: string): Promise<void> {
    const db = read();
    checkRemove(db, table, id);
    const rows = db[table] as { id: string }[];
    write(cascade({ ...db, [table]: rows.filter((r) => r.id !== id) }, table, id));
  },

  // Troca a lista de custos de um serviço de uma vez (salvar do formulário)
  async replaceJobCosts(jobId: string, costs: Tables["jobCosts"][]): Promise<void> {
    const db = read();
    write({ ...db, jobCosts: [...db.jobCosts.filter((c) => c.jobId !== jobId), ...costs] });
  },

  async reset(mode: "empty" | "sample"): Promise<void> {
    write(mode === "empty" ? emptyDatabase() : seedDatabase());
  },
};

// Lê uma tabela e se atualiza sozinho quando qualquer gravação acontece
export function useTable<T extends TableName>(table: T): { rows: Tables[T][]; loading: boolean } {
  const [rows, setRows] = useState<Tables[T][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      repo.list(table).then((r) => {
        if (!alive) return;
        setRows(r);
        setLoading(false);
      });
    load();
    listeners.add(load);
    // Outra aba gravou
    const onStorage = (e: StorageEvent) => e.key === KEY && load();
    window.addEventListener("storage", onStorage);
    return () => {
      alive = false;
      listeners.delete(load);
      window.removeEventListener("storage", onStorage);
    };
  }, [table]);

  return { rows, loading };
}
