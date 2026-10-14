"use client";

import { useRef, useState } from "react";

import { uploadPhoto } from "@/lib/admin/storage";

import { Avatar, Button } from "./ui";

// Reduz a imagem no próprio navegador (usado só na CNH, que fica na tabela de agentes)
async function resize(file: File, max = 480): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PhotoInput(props: { name: string; folder: "agents" | "vehicles"; value: string | null; onChange: (v: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <span className="[&>*]:size-20">
          <Avatar name={props.name} photo={props.value} />
        </span>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? "Enviando…" : props.value ? "Trocar foto" : "Adicionar foto"}
          </Button>
          {props.value && (
            <Button variant="danger" disabled={busy} onClick={() => props.onChange(null)}>
              Remover
            </Button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            setError("");
            try {
              props.onChange(await uploadPhoto(file, props.folder));
            } catch (err) {
              setError(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
      {error && <p className="text-[0.875rem] text-danger">{error}</p>}
    </div>
  );
}

// Documento (CNH): imagem maior, legível na impressão
export function DocumentInput(props: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3">
      {props.value && (
        <img src={props.value} alt={props.label} className="max-h-56 w-auto rounded-xl border border-line object-contain" />
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => input.current?.click()}>
          {props.value ? `Trocar ${props.label}` : `Anexar ${props.label}`}
        </Button>
        {props.value && (
          <Button variant="danger" onClick={() => props.onChange(null)}>
            Remover
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) props.onChange(await resize(file, 1400));
          e.target.value = "";
        }}
      />
    </div>
  );
}
