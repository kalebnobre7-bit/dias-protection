import { localContent } from "@/data/content";
import publishedJson from "@/data/published.json";
import type { PublishedContent, SiteContent } from "./types";

// Equipe e frota publicadas pelo painel ("Publicar no site" grava este JSON no repositório)
const published = publishedJson as PublishedContent;

// Ponto único de leitura do conteúdo. Na Fase B passa a buscar no Supabase.
export async function getSiteContent(): Promise<SiteContent> {
  const bySort = <T extends { sortOrder: number }>(items: T[]) =>
    [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    ...localContent,
    serviceTypes: bySort(localContent.serviceTypes),
    vehicleCategories: bySort(localContent.vehicleCategories),
    agents: bySort(published.agents.length ? published.agents : localContent.agents),
    vehicles: bySort(published.vehicles),
  };
}
