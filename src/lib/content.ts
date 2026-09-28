import { localContent } from "@/data/content";
import type { SiteContent } from "./types";

// Ponto único de leitura do conteúdo. Na Fase B passa a buscar no Supabase.
export async function getSiteContent(): Promise<SiteContent> {
  const bySort = <T extends { sortOrder: number }>(items: T[]) =>
    [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    ...localContent,
    serviceTypes: bySort(localContent.serviceTypes),
    vehicleCategories: bySort(localContent.vehicleCategories),
    agents: bySort(localContent.agents),
  };
}
