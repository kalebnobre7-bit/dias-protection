"use client";

import { useState } from "react";
import { FileText as IconDoc, Plus as IconPlus } from "lucide-react";

import { DocumentInput, PhotoInput } from "@/components/admin/PhotoInput";
import { Avatar, Badge, Button, DeleteButton, EmptyState, Field, List, PageHeader, PickMark, Row, SearchBox, Section, Sheet, Skeleton, Switch, useForm } from "@/components/admin/ui";
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
  career: "",
  phone: "",
  documentId: "",
  cnhUrl: null,
  notes: "",
  active: true,
  published: false,
  freelance: false,
  sortOrder: 0,
  createdAt: new Date().toISOString(),
});

export default function AgentsPage() {
  const { rows, loading } = useTable("agents");
  const { rows: jobs } = useTable("jobs");
  const [editing, setEditing] = useState<AgentRecord | null>(null);
  // Modo "Exportar PDF": ids escolhidos (null = fora do modo)
  const [picking, setPicking] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");
  // Fixos primeiro, avulsos depois, inativos no fim
  const sorted = [...rows].sort((a, b) => Number(b.active) - Number(a.active) || Number(a.freelance) - Number(b.freelance) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const q = query.trim().toLowerCase();
  const shown = sorted.filter((a) => !q || `${a.name} ${a.rolePt} ${a.languages.join(" ")}`.toLowerCase().includes(q));

  return (
    <>
      <PageHeader
        title="Agentes"
        subtitle="Perfil tipo currículo. Os publicados aparecem na página Equipe do site."
        action={
          picking ? (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setPicking(null)}>
                Cancelar
              </Button>
              <Button disabled={!picking.length} onClick={() => exportPdf(picking)}>
                <IconDoc className="size-4" /> Gerar PDF ({picking.length})
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {rows.length > 0 && (
                <Button variant="secondary" onClick={() => setPicking([])}>
                  <IconDoc className="size-4" /> Exportar PDF
                </Button>
              )}
              <Button onClick={() => setEditing(blank())}>
                <IconPlus className="size-4" /> Novo agente
              </Button>
            </div>
          )
        }
      />
      {picking && <p className="-mt-4 mb-4 px-1 text-[0.875rem] text-muted">Toque nos agentes que vão no PDF. Sai um currículo por página, sem contato nem documentos.</p>}
      {loading ? (
        <Skeleton />
      ) : !rows.length ? (
        <EmptyState title="Nenhum agente cadastrado" text="Cadastre a equipe com foto, idiomas e certificações." />
      ) : (
        <>
          <SearchBox value={query} onChange={setQuery} placeholder="Buscar por nome, função ou idioma" />
          {shown.length ? (
            <List>
              {shown.map((a) => {
                const count = jobs.filter((j) => j.agentIds.includes(a.id)).length;
                return (
                  <Row
                    key={a.id}
                    onClick={() => (picking ? setPicking(picking.includes(a.id) ? picking.filter((x) => x !== a.id) : [...picking, a.id]) : setEditing(a))}
                    leading={<Avatar name={a.name} photo={a.photoUrl} />}
                    title={a.name}
                    subtitle={[a.rolePt, a.languages.join(", ")].filter(Boolean).join(" · ")}
                    trailing={
                      picking ? (
                        <PickMark on={picking.includes(a.id)} />
                      ) : (
                        <span className="flex flex-col items-end gap-1">
                          {!a.active ? (
                            <Badge tone="bad">Inativo</Badge>
                          ) : a.freelance ? (
                            <Badge tone="warn">Avulso</Badge>
                          ) : a.published ? (
                            <Badge tone="good">No site</Badge>
                          ) : (
                            <Badge>Interno</Badge>
                          )}
                          <span className="num text-xs text-muted">{count} serviço(s)</span>
                        </span>
                      )
                    }
                  />
                );
              })}
            </List>
          ) : (
            <p className="mt-6 text-center text-muted">Nenhum agente encontrado.</p>
          )}
        </>
      )}
      {editing && <AgentSheet agent={editing} isNew={!rows.some((r) => r.id === editing.id)} onClose={() => setEditing(null)} />}
    </>
  );
}

// Abre a apresentação em A4 (sem dados internos) em outra aba
const exportPdf = (ids: string[]) =>
  window.open(`${process.env.NEXT_PUBLIC_BASE_PATH}/admin/apresentacao?agentes=${ids.join(",")}`, "_blank", "noopener");

function AgentSheet({ agent, isNew, onClose }: { agent: AgentRecord; isNew: boolean; onClose: () => void }) {
  const { value: a, set, dirty } = useForm(agent);
  const [error, setError] = useState("");

  const persist = async () => {
    if (!a.name.trim()) {
      setError("Informe o nome.");
      return false;
    }
    try {
      await repo.upsert("agents", { ...a, name: a.name.trim() });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      return false;
    }
  };
  const save = async () => {
    if (await persist()) onClose();
  };
  // Salva e abre o currículo em A4 em outra aba
  const openCv = async () => {
    if (await persist()) window.open(`${process.env.NEXT_PUBLIC_BASE_PATH}/admin/agentes/curriculo?id=${a.id}`, "_blank", "noopener");
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
      dirty={dirty}
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PhotoInput name={a.name} folder="agents" value={a.photoUrl} onChange={(v) => set("photoUrl", v)} />
        <Button variant="secondary" onClick={openCv}>
          <IconDoc className="size-4" /> Currículo / PDF
        </Button>
      </div>
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

      <Field label="Experiência profissional" hint="Uma por linha. Ex.: 2019–2024 · Agente de proteção · Empresa X. Vai só no currículo.">
        <textarea className="input resize-none" rows={4} value={a.career} onChange={(e) => set("career", e.target.value)} />
      </Field>

      <Section title="Visibilidade">
        <div className="rounded-2xl border border-line px-4 py-2">
          <Switch checked={a.active} onChange={(v) => set("active", v)} label="Ativo" hint="Inativos não aparecem na escala de serviços" />
          <div className="border-t border-line" />
          <Switch
            checked={a.freelance}
            onChange={(v) => {
              set("freelance", v);
              if (v) set("published", false);
            }}
            label="Avulso (freelancer)"
            hint="Não é fixo da empresa. Avulsos nunca vão para o site."
          />
          {!a.freelance && (
            <>
              <div className="border-t border-line" />
              <Switch checked={a.published} onChange={(v) => set("published", v)} label="Mostrar no site" hint="Nome, função, bio, idiomas, certificações e foto. Depois, publique na aba Site." />
            </>
          )}
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
          {/* div em vez de Field: label com botões dentro dispararia o upload ao clicar no texto */}
          <div>
            <span className="mb-1.5 block text-[0.875rem] font-medium text-silver">CNH</span>
            <DocumentInput label="CNH" value={a.cnhUrl} onChange={(v) => set("cnhUrl", v)} />
            <span className="mt-1.5 block text-xs text-muted">Foto ou print da CNH. Só aparece no documento de serviço fechado.</span>
          </div>
          <Field label="Observações">
            <textarea className="input resize-none" rows={2} value={a.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
      </Section>
    </Sheet>
  );
}
