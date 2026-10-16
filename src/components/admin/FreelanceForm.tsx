"use client";

import { useState } from "react";
import { UserPlus as IconUserPlus } from "lucide-react";

import { newId, repo } from "@/lib/admin/store";
import type { AgentRecord } from "@/lib/admin/types";

import { PhotoInput } from "./PhotoInput";
import { Button, Field, TextArea } from "./ui";

// Avulso (freelancer): vira um agente marcado como avulso e já entra na escala de quem chamou
export function FreelanceForm({ onAdded }: { onAdded: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Agente de proteção");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setOpen(false);
    setName("");
    setRole("Agente de proteção");
    setBio("");
    setPhoto(null);
    setError("");
  };

  const add = async () => {
    if (!name.trim()) return setError("Informe o nome.");
    const agent: AgentRecord = {
      id: newId(),
      name: name.trim(),
      rolePt: role.trim(),
      roleEn: "",
      bioPt: bio.trim(),
      bioEn: "",
      languages: [],
      yearsExperience: null,
      certifications: [],
      photoUrl: photo,
      career: "",
      phone: "",
      documentId: "",
      cnhUrl: null,
      notes: "",
      active: true,
      published: false,
      freelance: true,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
    };
    setBusy(true);
    try {
      await repo.upsert("agents", agent);
      onAdded(agent.id);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível adicionar.");
    } finally {
      setBusy(false);
    }
  };

  if (!open)
    return (
      <Button variant="ghost" className="!min-h-9 !px-3" onClick={() => setOpen(true)}>
        <IconUserPlus className="size-4" /> Adicionar avulso (freelancer)
      </Button>
    );

  return (
    <div className="space-y-4 rounded-2xl border border-line-strong p-4">
      <p className="text-[0.875rem] text-muted">Freelancer só para este trabalho. Fica salvo em Agentes como avulso e nunca vai para o site.</p>
      <PhotoInput name={name} folder="agents" value={photo} onChange={setPhoto} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Função">
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} />
        </Field>
      </div>
      <Field label="Biografia">
        <TextArea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>
      {error && (
        <p role="alert" className="text-[0.875rem] text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button variant="danger" onClick={reset} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="secondary" onClick={add} disabled={busy}>
          {busy ? "Adicionando…" : "Adicionar à equipe"}
        </Button>
      </div>
    </div>
  );
}
