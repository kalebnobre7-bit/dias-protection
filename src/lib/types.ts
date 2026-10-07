// Tipos espelham as tabelas do Supabase (supabase/migrations).
// Campos traduzíveis viram `Localized` aqui; no banco são colunas `_pt` / `_en`.

export type Locale = "pt" | "en";

export type Localized = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

// logo: arquivo em public/images/logos; scale compensa logos com muito respiro interno
export type BrandLogo = { name: string; logo?: string; scale?: number };

export type Company = {
  legalName: string;
  brandName: string;
  tagline: string;
  founderName: string;
  founderShortName: string;
  founderRole: Localized;
  founderBio: Localized;
  founderPhoto: string;
  about: Localized;
  whatsapp: string; // só dígitos, com DDI: 5511999999999
  email: string;
  instagram: string; // handle sem @
  linkedin: string; // slug do perfil
  city: string;
  trustedBy: BrandLogo[]; // empresas atendidas, faixa no rodapé (autorizado pelo Gabriel em 10/2026)
};

export type ServiceType = {
  id: string; // slug: usado em /servicos/[id] e ?servico=
  name: Localized;
  summary: Localized;
  description: Localized;
  includes: LocalizedList;
  idealFor: Localized;
  image: string;
  sortOrder: number;
};

export type VehicleCategory = {
  id: string;
  name: Localized;
  description: Localized;
  capacity: number;
  armored: boolean;
  image: string | null; // ilustração 3D com fundo transparente (public/images/fleet)
  sortOrder: number;
};

export type Agent = {
  id: string;
  name: string;
  role: Localized;
  bio: Localized;
  languages: string[];
  yearsExperience: number | null;
  certifications: string[];
  photoUrl: string | null;
  sortOrder: number;
};

// Veículo publicado na página Frota (vem do painel via "Publicar no site"; sem placa)
export type PublicVehicle = {
  id: string;
  categoryId: string | null;
  model: string;
  year: number | null;
  color: string;
  capacity: number | null;
  armored: boolean;
  description: Localized;
  photoUrl: string | null;
  sortOrder: number;
};

// src/data/published.json: o que o painel publicou por último
export type PublishedContent = { updatedAt: string | null; agents: Agent[]; vehicles: PublicVehicle[] };

// Trajetória do fundador (página Sobre). Parágrafos separados por linha em branco;
// logos = mostra experienceWith depois de `text`, seguido de `more`
export type Milestone = { period: Localized; title: Localized; text: Localized; logos?: boolean; more?: Localized };

export type FounderProfile = {
  stats: { value: string; label: Localized }[];
  timeline: Milestone[];
  certifications: Localized[];
  recognitions: Localized[];
  education: Localized[];
  languages: Localized;
  // Empresas para as quais já atuou (currículo) e clientes atendidos
  experienceWith: BrandLogo[];
  notableClients: { name: string; context: string }[];
  showNotableClients: boolean; // só liga com autorização do Gabriel
};

export type SiteContent = {
  company: Company;
  founder: FounderProfile;
  serviceTypes: ServiceType[];
  vehicleCategories: VehicleCategory[];
  agents: Agent[];
  vehicles: PublicVehicle[];
};
