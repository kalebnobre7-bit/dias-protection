import type { Database } from "./types";

export function emptyDatabase(): Database {
  return { agents: [], vehicles: [], clients: [], partners: [], jobs: [], jobCosts: [], transactions: [], proposals: [] };
}
