import { localContent } from "@/data/content";
import { getPublicClient } from "./supabase";
import type { Agent, PublicVehicle, SiteContent } from "./types";

type AgentRow = {
  id: string; name: string; role_pt: string; role_en: string; bio_pt: string; bio_en: string;
  languages: string[]; years_experience: number | null; certifications: string[];
  photo_url: string | null; sort_order: number;
};
type VehicleRow = {
  id: string; category_id: string | null; model: string; color: string | null; year: number | null;
  photo_url: string | null; description_pt: string; description_en: string; capacity: number | null; armored: boolean;
};

// O papel anon só enxerga estas colunas (o resto, como telefone, documento e placa, o banco bloqueia).
// Listar as colunas é obrigatório: `select *` falha para o anon.
const AGENT_COLUMNS = "id, name, role_pt, role_en, bio_pt, bio_en, languages, years_experience, certifications, photo_url, sort_order";
const VEHICLE_COLUMNS = "id, category_id, model, color, year, photo_url, description_pt, description_en, capacity, armored";

// Equipe e frota publicadas no painel (marcadas "no site"). Sem Supabase ou sem rede, o site sobe sem elas.
async function loadPublished(): Promise<{ agents: Agent[]; vehicles: PublicVehicle[] }> {
  const sb = getPublicClient();
  if (!sb) return { agents: localContent.agents, vehicles: localContent.vehicles };

  const [agents, vehicles] = await Promise.all([
    sb.from("agents").select(AGENT_COLUMNS).order("sort_order").order("name").returns<AgentRow[]>(),
    sb.from("vehicles").select(VEHICLE_COLUMNS).order("model").returns<VehicleRow[]>(),
  ]);
  if (agents.error || vehicles.error) return { agents: [], vehicles: [] };

  return {
    agents: agents.data.map((a) => ({
      id: a.id,
      name: a.name,
      role: { pt: a.role_pt, en: a.role_en || a.role_pt },
      bio: { pt: a.bio_pt, en: a.bio_en || a.bio_pt },
      languages: a.languages,
      yearsExperience: a.years_experience,
      certifications: a.certifications,
      photoUrl: a.photo_url,
      sortOrder: a.sort_order,
    })),
    vehicles: vehicles.data.map((v, sortOrder) => ({
      id: v.id,
      categoryId: v.category_id,
      model: v.model,
      year: v.year,
      color: v.color ?? "",
      capacity: v.capacity,
      armored: v.armored,
      description: { pt: v.description_pt, en: v.description_en || v.description_pt },
      photoUrl: v.photo_url,
      sortOrder,
    })),
  };
}

// Ponto único de leitura do conteúdo: textos fixos em src/data/content.ts, equipe e frota no Supabase
export async function getSiteContent(): Promise<SiteContent> {
  const bySort = <T extends { sortOrder: number }>(items: T[]) =>
    [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const { agents, vehicles } = await loadPublished();

  return {
    ...localContent,
    serviceTypes: bySort(localContent.serviceTypes),
    vehicleCategories: bySort(localContent.vehicleCategories),
    agents: bySort(agents),
    vehicles: bySort(vehicles),
  };
}
