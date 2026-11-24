"use client";

import { useRef, useState } from "react";
import { X as IconClose } from "lucide-react";

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

// Álbum do veículo: miniaturas com remover e botão para adicionar várias de uma vez, até `max`
export function AlbumInput(props: { value: string[]; onChange: (v: string[]) => void; max: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const room = props.max - props.value.length;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {props.value.map((url) => (
          <span key={url} className="relative">
            <img src={url} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => props.onChange(props.value.filter((x) => x !== url))}
              aria-label="Remover foto do álbum"
              className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-ink/80 text-text hover:text-danger"
            >
              <IconClose className="size-4" />
            </button>
          </span>
        ))}
      </div>
      {room > 0 && (
        <Button variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Enviando…" : `Adicionar fotos (faltam ${room})`}
        </Button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])].slice(0, room);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          setError("");
          try {
            const urls: string[] = [];
            for (const file of files) urls.push(await uploadPhoto(file, "vehicles"));
            props.onChange([...props.value, ...urls]);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
          } finally {
            setBusy(false);
          }
        }}
      />
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
