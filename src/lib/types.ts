// Tipos espelham as tabelas do Supabase (supabase/migrations).
// Campos traduzíveis viram `Localized` aqui; no banco são colunas `_pt` / `_en`.

export type Locale = "pt" | "en";

export type Localized = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

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

// Trajetória do fundador (página Sobre)
export type Milestone = { period: Localized; title: Localized; text: Localized };

export type FounderProfile = {
  stats: { value: string; label: Localized }[];
  timeline: Milestone[];
  certifications: string[];
  recognitions: Localized[];
  education: Localized[];
  languages: Localized;
  // Empresas para as quais já atuou (currículo) e clientes atendidos
  // logo: arquivo em public/images/logos; scale compensa logos com muito respiro interno
  experienceWith: { name: string; logo?: string; scale?: number }[];
  notableClients: { name: string; context: string }[];
  showNotableClients: boolean; // só liga com autorização do Gabriel
};

export type SiteContent = {
  company: Company;
  founder: FounderProfile;
  serviceTypes: ServiceType[];
  vehicleCategories: VehicleCategory[];
  agents: Agent[];
};
