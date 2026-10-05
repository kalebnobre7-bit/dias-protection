"use client";

import { useRef, useState } from "react";

import { type PhotoFolder, uploadPhoto } from "@/lib/admin/photos";
import { requireSupabase } from "@/lib/supabase";

import { Avatar, Button } from "./ui";

// Reduz a foto para 480px no navegador e envia para o Supabase Storage (bucket `photos`).
// O formulário recebe a URL pública; a foto fica no ar quando o registro for salvo e publicado.
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível processar a imagem."))), "image/jpeg", 0.82),
  );
}

export function PhotoInput(props: {
  name: string;
  value: string | null;
  folder: PhotoFolder;
  id: string;
  onChange: (v: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      props.onChange(await uploadPhoto(requireSupabase(), props.folder, props.id, await resize(file)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar a foto.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="[&>*]:size-20">
        <Avatar name={props.name} photo={props.value} />
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Enviando…" : props.value ? "Trocar foto" : "Adicionar foto"}
        </Button>
        {props.value && !busy && (
          <Button variant="danger" onClick={() => props.onChange(null)}>
            Remover
          </Button>
        )}
        {error && <span className="basis-full text-[0.875rem] text-danger">{error}</span>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void pick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
