"use client";

import { useState } from "react";
import { Plus as IconPlus } from "lucide-react";

import { PhotoInput } from "@/components/admin/PhotoInput";
import { Avatar, Badge, Button, DeleteButton, EmptyState, Field, List, PageHeader, Row, Section, Sheet, Switch, useForm } from "@/components/admin/ui";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { AgentRecord } from "@/lib/admin/types";

const blank = (): AgentRecord => ({
  id: newId(),
  name: "",
  rolePt: "",
  roleEn: "",
  bioPt: "",
  bioEn: "",
  languages: [],
  yearsExperience: null,
  certifications: [],
  photoUrl: null,
  phone: "",
  documentId: "",
  notes: "",
  active: true,
  published: false,
  sortOrder: 0,
  createdAt: new Date().toISOString(),
});

export default function AgentsPage() {
  const { rows, loading } = useTable("agents");
  const { rows: jobs } = useTable("jobs");
  const [editing, setEditing] = useState<AgentRecord | null>(null);
  const sorted = [...rows].sort((a, b) => Number(b.active) - Number(a.active) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader
        title="Agentes"
        subtitle="Perfil tipo currículo. Os publicados aparecem na página Equipe do site."
        action={
          <Button onClick={() => setEditing(blank())}>
            <IconPlus className="size-4" /> Novo agente
          </Button>
        }
      />
      {!loading && !rows.length ? (
        <EmptyState title="Nenhum agente cadastrado" text="Cadastre a equipe com foto, idiomas e certificações." />
      ) : (
        <List>
          {sorted.map((a) => {
            const count = jobs.filter((j) => j.agentIds.includes(a.id)).length;
            return (
              <Row
                key={a.id}
                onClick={() => setEditing(a)}
                leading={<Avatar name={a.name} photo={a.photoUrl} />}
                title={a.name}
                subtitle={[a.rolePt, a.languages.join(", ")].filter(Boolean).join(" · ")}
                trailing={
                  <span className="flex flex-col items-end gap-1">
                    {!a.active ? <Badge tone="bad">Inativo</Badge> : a.published ? <Badge tone="good">No site</Badge> : <Badge>Interno</Badge>}
                    <span className="num text-xs text-muted">{count} serviço(s)</span>
                  </span>
                }
              />
            );
          })}
        </List>
      )}
      {editing && <AgentSheet agent={editing} isNew={!rows.some((r) => r.id === editing.id)} onClose={() => setEditing(null)} />}
    </>
  );
}

function AgentSheet({ agent, isNew, onClose }: { agent: AgentRecord; isNew: boolean; onClose: () => void }) {
  const { value: a, set } = useForm(agent);
  const [error, setError] = useState("");

  const save = async () => {
    if (!a.name.trim()) return setError("Informe o nome.");
    await repo.upsert("agents", { ...a, name: a.name.trim() });
    onClose();
  };
  const remove = async () => {
    try {
      await repo.remove("agents", a.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
  };

  return (
    <Sheet
      open
      error={error}
      onClose={onClose}
      title={isNew ? "Novo agente" : a.name || "Agente"}
      footer={
        <>
          {!isNew && <DeleteButton onConfirm={remove} />}
          <Button className="ml-auto" onClick={save}>
            Salvar
          </Button>
        </>
      }
    >
      <PhotoInput name={a.name} value={a.photoUrl} onChange={(v) => set("photoUrl", v)} />
      <Field label="Nome">
        <input className="input" value={a.name} onChange={(e) => set("name", e.target.value)} autoFocus={isNew} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Função (PT)">
          <input className="input" value={a.rolePt} onChange={(e) => set("rolePt", e.target.value)} placeholder="Agente de proteção" />
        </Field>
        <Field label="Função (EN)">
          <input className="input" value={a.roleEn} onChange={(e) => set("roleEn", e.target.value)} placeholder="Protection agent" />
        </Field>
      </div>
      <Field label="Bio (PT)">
        <textarea className="input resize-none" rows={3} value={a.bioPt} onChange={(e) => set("bioPt", e.target.value)} />
      </Field>
      <Field label="Bio (EN)">
        <textarea className="input resize-none" rows={3} value={a.bioEn} onChange={(e) => set("bioEn", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Idiomas" hint="Separados por vírgula">
          <input
            className="input"
            defaultValue={a.languages.join(", ")}
            onChange={(e) => set("languages", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          />
        </Field>
        <Field label="Anos de experiência">
          <input
            className="input num"
            type="number"
            min={0}
            inputMode="numeric"
            value={a.yearsExperience ?? ""}
            onChange={(e) => set("yearsExperience", e.target.value === "" ? null : Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Certificações" hint="Uma por linha">
        <textarea
          className="input resize-none"
          rows={3}
          defaultValue={a.certifications.join("\n")}
          onChange={(e) => set("certifications", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
        />
      </Field>

      <Section title="Visibilidade">
        <div className="rounded-2xl border border-line px-4 py-2">
          <Switch checked={a.active} onChange={(v) => set("active", v)} label="Ativo" hint="Inativos não aparecem na escala de serviços" />
          <div className="border-t border-line" />
          <Switch checked={a.published} onChange={(v) => set("published", v)} label="Mostrar no site" hint="Nome, função, bio, idiomas e foto" />
        </div>
      </Section>

      <Section title="Dados internos (não aparecem no site)">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone">
              <input className="input" type="tel" value={a.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Documento" hint="CPF ou registro de vigilante">
              <input className="input" value={a.documentId} onChange={(e) => set("documentId", e.target.value)} />
            </Field>
          </div>
          <Field label="Observações">
            <textarea className="input resize-none" rows={2} value={a.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
      </Section>
    </Sheet>
  );
}
