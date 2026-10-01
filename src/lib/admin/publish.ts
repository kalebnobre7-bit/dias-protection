"use client";

import publishedNow from "@/data/published.json";
import type { Agent, PublicVehicle, PublishedContent } from "@/lib/types";

import type { AgentRecord, Vehicle } from "./types";

// "Publicar no site": o painel grava src/data/published.json no GitHub pela API.
// O push dispara o deploy do GitHub Pages e a Equipe/Frota do site passam a refletir o painel.
// Sem servidor: o token fica só neste navegador (localStorage).

export const PUBLISH_DEFAULTS = { owner: "kalebnobre7-bit", repo: "dias-protection", branch: "main" };
export const PUBLISH_PATH = "src/data/published.json";
const KEY = "dias-admin:publish";

export type PublishSettings = { token: string; owner: string; repo: string; branch: string };

export function loadSettings(): PublishSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...PUBLISH_DEFAULTS, token: "", ...(JSON.parse(raw) as Partial<PublishSettings>) };
  } catch {
    // storage bloqueado: usa os padrões
  }
  return { ...PUBLISH_DEFAULTS, token: "" };
}

export function saveSettings(s: PublishSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

// Só o que o site mostra: nada de telefone, documento, placa ou observações
export function toPublicAgent(a: AgentRecord): Agent {
  return {
    id: a.id,
    name: a.name,
    role: { pt: a.rolePt, en: a.roleEn || a.rolePt },
    bio: { pt: a.bioPt, en: a.bioEn || a.bioPt },
    languages: a.languages,
    yearsExperience: a.yearsExperience,
    certifications: a.certifications,
    photoUrl: a.photoUrl,
    sortOrder: a.sortOrder,
  };
}

export function toPublicVehicle(v: Vehicle, index: number): PublicVehicle {
  return {
    id: v.id,
    categoryId: v.categoryId,
    model: v.model,
    year: v.year,
    color: v.color,
    capacity: v.capacity,
    armored: v.armored,
    description: { pt: v.descriptionPt, en: v.descriptionEn || v.descriptionPt },
    photoUrl: v.photoUrl,
    sortOrder: index,
  };
}

export function buildPublished(agents: AgentRecord[], vehicles: Vehicle[]): PublishedContent {
  return {
    updatedAt: new Date().toISOString(),
    agents: agents
      .filter((a) => a.active && a.published)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map(toPublicAgent),
    vehicles: vehicles
      .filter((v) => v.active && v.published)
      .sort((a, b) => a.model.localeCompare(b.model))
      .map(toPublicVehicle),
  };
}

export const currentPublished = () => publishedNow as PublishedContent;

// Compara o que está no site (build atual) com o que o painel publicaria agora
export function isDirty(next: PublishedContent): boolean {
  const strip = (c: PublishedContent) => JSON.stringify({ agents: c.agents, vehicles: c.vehicles });
  return strip(next) !== strip(currentPublished());
}

// base64 de texto UTF-8 (btoa sozinho quebra com acentos)
function base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export async function publishToGitHub(content: PublishedContent, s: PublishSettings): Promise<{ commitUrl: string; actionsUrl: string }> {
  if (!s.token.trim()) throw new Error("Informe o token do GitHub em “Conexão com o GitHub”.");
  const api = `https://api.github.com/repos/${s.owner}/${s.repo}/contents/${PUBLISH_PATH}`;
  const headers = {
    Authorization: `Bearer ${s.token.trim()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // sha do arquivo atual (obrigatório para sobrescrever)
  let sha: string | undefined;
  const current = await fetch(`${api}?ref=${encodeURIComponent(s.branch)}`, { headers });
  if (current.ok) sha = ((await current.json()) as { sha: string }).sha;
  else if (current.status === 401) throw new Error("Token inválido ou expirado.");
  else if (current.status === 403) throw new Error("O token não tem permissão de conteúdo neste repositório.");
  else if (current.status !== 404) throw new Error(`GitHub respondeu ${current.status} ao ler o arquivo.`);

  const body = {
    message: `Publica equipe e frota pelo painel (${content.agents.length} agente(s), ${content.vehicles.length} veículo(s))`,
    content: base64(JSON.stringify(content, null, 2) + "\n"),
    branch: s.branch,
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(api, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `GitHub respondeu ${res.status} ao gravar.`);
  }
  const data = (await res.json()) as { commit: { html_url: string } };
  return { commitUrl: data.commit.html_url, actionsUrl: `https://github.com/${s.owner}/${s.repo}/actions` };
}
