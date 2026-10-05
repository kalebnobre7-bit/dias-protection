import type { SupabaseClient } from "@supabase/supabase-js";

// Fotos de agentes e veículos vão para o bucket público `photos` do Supabase Storage.
// Só imports relativos aqui: scripts/import-json.mjs também usa este módulo no Node.

export const PHOTO_BUCKET = "photos";
export type PhotoFolder = "agents" | "vehicles";

export const isDataUrl = (value: string | null | undefined): value is string => typeof value === "string" && value.startsWith("data:");

// "data:image/jpeg;base64,…" → Blob (navegador e Node 22)
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(5, comma); // "image/jpeg;base64"
  const [mime, encoding] = header.split(";");
  const payload = dataUrl.slice(comma + 1);
  const binary = encoding === "base64" ? atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime || "image/jpeg" });
}

// Caminho com carimbo de tempo: trocar a foto gera URL nova, sem cache antigo no site
export function photoPath(folder: PhotoFolder, id: string, now = Date.now()): string {
  return `${folder}/${id}-${now}.jpg`;
}

export async function uploadPhoto(client: SupabaseClient, folder: PhotoFolder, id: string, blob: Blob): Promise<string> {
  const path = photoPath(folder, id);
  const { error } = await client.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true });
  if (error) throw new Error(`Não foi possível enviar a foto: ${error.message}`);
  return client.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

// Foto antiga em data URL (painel da Fase A) → Storage. URLs normais passam direto.
export async function ensureStoredPhoto(
  client: SupabaseClient,
  folder: PhotoFolder,
  id: string,
  value: string | null,
): Promise<string | null> {
  if (!isDataUrl(value)) return value;
  return uploadPhoto(client, folder, id, dataUrlToBlob(value));
}
