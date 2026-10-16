"use client";

import { localContent } from "@/data/content";

import { DEFAULT_PAYMENT, DEFAULT_TERMS, ITEM_PRESETS, UNITS } from "./proposals";
import { useTable } from "./store";
import type { Settings } from "./types";

// Padrões do código: valem enquanto o Gabriel não salvar a tela Configurações (e para campo que faltar)
const { company } = localContent;
export const DEFAULT_SETTINGS: Settings = {
  id: "app",
  company: {
    founderName: company.founderName,
    founderRole: company.founderRole.pt,
    legalName: company.legalName,
    whatsapp: company.whatsapp,
    email: company.email,
    instagram: company.instagram,
    city: company.city,
  },
  proposal: {
    validityDays: 10,
    paymentTerms: DEFAULT_PAYMENT,
    terms: DEFAULT_TERMS,
    units: UNITS,
    presets: ITEM_PRESETS,
  },
  createdAt: "",
};

// Linha salva + padrões (a coluna jsonb pode vir vazia ou sem algum campo)
const merge = (row: Settings | undefined): Settings =>
  row
    ? {
        ...row,
        company: { ...DEFAULT_SETTINGS.company, ...(row.company || {}) },
        proposal: { ...DEFAULT_SETTINGS.proposal, ...(row.proposal || {}) },
      }
    : DEFAULT_SETTINGS;

export function useSettings(): { settings: Settings; loading: boolean } {
  const { rows, loading } = useTable("settings");
  return { settings: merge(rows.find((r) => r.id === "app")), loading };
}
