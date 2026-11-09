import { localContent } from "@/data/content";

import type { Job } from "./types";

// Tipos de serviço e categorias de veículo vêm do conteúdo do site (em PT)
export const serviceTypeOptions = [...localContent.serviceTypes]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((s) => ({ value: s.id, label: s.name.pt }));

export const vehicleCategoryOptions = [...localContent.vehicleCategories]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((c) => ({ value: c.id, label: c.name.pt }));

// Serviços que saíram do site (10/2026), mas podem estar em serviços e propostas antigos
const legacyServiceNames: Record<string, string> = {
  "escolta-veicular": "Escolta veicular",
  "analise-de-risco": "Advance e análise de risco",
};

export const serviceTypeName = (id: string | null) =>
  serviceTypeOptions.find((o) => o.value === id)?.label ?? (id && legacyServiceNames[id]) ?? "Sem tipo";
// "Transporte executivo + Eventos"; serviços antigos só têm o tipo principal
export const jobServiceNames = (j: Pick<Job, "serviceTypeId" | "serviceTypeIds">) =>
  (j.serviceTypeIds.length ? j.serviceTypeIds : [j.serviceTypeId]).map(serviceTypeName).join(" + ");
export const vehicleCategoryName = (id: string | null, lang: "pt" | "en" = "pt") =>
  localContent.vehicleCategories.find((c) => c.id === id)?.name[lang] ?? (lang === "pt" ? "Sem categoria" : "");

// Serviços da proposta (mono/bilíngue); `type` é o tipo de serviço usado quando a proposta vira serviço
const proposalLines = [
  { id: "transporte-executivo", type: "transporte-executivo", pt: "Transporte executivo", en: "executive transportation" },
  { id: "protecao-pessoal", type: "protecao-executiva", pt: "Proteção pessoal executiva", en: "executive protection" },
  { id: "eventos-privados", type: "eventos", pt: "Segurança em eventos privados", en: "private event security" },
  { id: "patrimonio-alto-valor", type: "patrimonio", pt: "Segurança de patrimônio de alto valor", en: "high-value asset security" },
];
export const proposalServices = proposalLines.flatMap((s) => [
  { id: `${s.id}-mono`, type: s.type, pt: `${s.pt} mono`, en: `Monolingual ${s.en}` },
  { id: `${s.id}-bilingue`, type: s.type, pt: `${s.pt} bilíngue`, en: `Bilingual ${s.en}` },
]);
export const proposalServiceOptions = proposalServices.map((s) => ({ value: s.id, label: s.pt }));

// Aceita também os ids antigos (tipos do site) das propostas já salvas
export function proposalServiceName(id: string, lang: "pt" | "en" = "pt"): string {
  const found = proposalServices.find((s) => s.id === id);
  if (found) return found[lang];
  return localContent.serviceTypes.find((s) => s.id === id)?.name[lang] ?? serviceTypeName(id);
}

// Proposta → tipos de serviço do cadastro, sem repetir
export const proposalServiceTypes = (ids: string[]) => [...new Set(ids.map((id) => proposalServices.find((s) => s.id === id)?.type ?? id))];
