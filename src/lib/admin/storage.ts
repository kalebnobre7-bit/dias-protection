"use client";

import { getBrowserClient } from "@/lib/supabase";

// Fotos públicas (agentes e veículos) vão para o bucket `photos` do Supabase Storage.
// A CNH não passa por aqui: fica na tabela agents, que o site nunca lê.

async function toJpeg(file: File, max: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Não foi possível processar a imagem."))), "image/jpeg", 0.85),
  );
}

export async function uploadPhoto(file: File, folder: "agents" | "vehicles", max = 1000): Promise<string> {
  const sb = getBrowserClient();
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from("photos").upload(path, await toJpeg(file, max), { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error(`Não foi possível enviar a foto: ${error.message}`);
  return sb.storage.from("photos").getPublicUrl(path).data.publicUrl;
}
