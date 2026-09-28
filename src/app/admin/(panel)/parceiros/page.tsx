"use client";

import { useState } from "react";
import { Plus as IconPlus } from "lucide-react";

import { Avatar, Badge, Button, DeleteButton, EmptyState, Field, List, PageHeader, Row, SearchBox, Section, Sheet, useForm } from "@/components/admin/ui";
import { brl, formatDateTime } from "@/lib/admin/labels";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { Partner } from "@/lib/admin/types";

const blank = (): Partner => ({
  id: newId(),
  name: "",
  kind: "",
  contact: "",
  phone: "",
  email: "",
  notes: "",
  createdAt: new Date().toISOString(),
});

export default function PartnersPage() {
  const { rows, loading } = useTable("partners");
  const { rows: costs } = useTable("jobCosts");
  const [editing, setEditing] = useState<Partner | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = rows
    .filter((p) => !q || `${p.name} ${p.kind} ${p.contact}`.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader
        title="Parceiros"
        subtitle="Fornecedores, locadoras, hotéis e freelancers."
        action={
          <Button onClick={() => setEditing(blank())}>
            <IconPlus className="size-4" /> Novo parceiro
          </Button>
        }
      />
      {!loading && !rows.length ? (
        <EmptyState title="Nenhum parceiro cadastrado" />
      ) : (
        <>
          <SearchBox value={query} onChange={setQuery} placeholder="Buscar por nome, tipo ou contato" />
          <List>
            {filtered.map((p) => {
              const total = costs.filter((c) => c.partnerId === p.id).reduce((s, c) => s + c.amount, 0);
              return (
                <Row
                  key={p.id}
                  onClick={() => setEditing(p)}
                  leading={<Avatar name={p.name} />}
                  title={p.name}
                  subtitle={[p.kind, p.contact || p.phone].filter(Boolean).join(" · ") || "Sem contato"}
                  trailing={<span className="num font-medium">{brl.format(total)}</span>}
                />
              );
            })}
          </List>
        </>
      )}
      {editing && <PartnerSheet partner={editing} isNew={!rows.some((r) => r.id === editing.id)} onClose={() => setEditing(null)} />}
    </>
  );
}

function PartnerSheet(props: { partner: Partner; isNew: boolean; onClose: () => void }) {
  const { value: p, set } = useForm(props.partner);
  const { rows: costs } = useTable("jobCosts");
  const { rows: jobs } = useTable("jobs");
  const { rows: vehicles } = useTable("vehicles");
  const [error, setError] = useState("");

  const mine = costs.filter((c) => c.partnerId === p.id);
  const jobDate = (jobId: string) => jobs.find((j) => j.id === jobId)?.startsAt ?? "";
  const fleet = vehicles.filter((v) => v.partnerId === p.id);

  const save = async () => {
    if (!p.name.trim()) return setError("Informe o nome.");
    await repo.upsert("partners", { ...p, name: p.name.trim() });
    props.onClose();
  };
  const remove = async () => {
    await repo.remove("partners", p.id);
    props.onClose();
  };

  return (
    <Sheet
      open
      error={error}
      onClose={props.onClose}
      title={props.isNew ? "Novo parceiro" : p.name || "Parceiro"}
      footer={
        <>
          {!props.isNew && <DeleteButton onConfirm={remove} />}
          <Button className="ml-auto" onClick={save}>
            Salvar
          </Button>
        </>
      }
    >
      <Field label="Nome">
        <input className="input" value={p.name} onChange={(e) => set("name", e.target.value)} autoFocus={props.isNew} />
      </Field>
      <Field label="Tipo" hint="Hotel, locadora, fornecedor, freelancer…">
        <input className="input" value={p.kind} onChange={(e) => set("kind", e.target.value)} />
      </Field>
      <Field label="Pessoa de contato">
        <input className="input" value={p.contact} onChange={(e) => set("contact", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefone">
          <input className="input" type="tel" value={p.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="E-mail">
          <input className="input" type="email" value={p.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
      </div>
      <Field label="Observações">
        <textarea className="input resize-none" rows={3} value={p.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>

      {!props.isNew && (
        <>
          {fleet.length > 0 && (
            <Section title="Veículos deste parceiro">
              <List>
                {fleet.map((v) => (
                  <Row key={v.id} title={v.model} subtitle={[v.plate, v.color].filter(Boolean).join(" · ")} />
                ))}
              </List>
            </Section>
          )}
          <Section title={`Pagamentos · ${brl.format(mine.reduce((s, c) => s + c.amount, 0))}`}>
            {mine.length ? (
              <List>
                {mine.map((c) => (
                  <Row
                    key={c.id}
                    title={c.description}
                    subtitle={formatDateTime(jobDate(c.jobId))}
                    trailing={
                      <span className="flex flex-col items-end gap-1">
                        <span className="num font-medium">{brl.format(c.amount)}</span>
                        <Badge tone={c.paid ? "good" : "warn"}>{c.paid ? "Pago" : "A pagar"}</Badge>
                      </span>
                    }
                  />
                ))}
              </List>
            ) : (
              <p className="text-[0.9375rem] text-muted">Nenhum custo de serviço ligado a este parceiro.</p>
            )}
          </Section>
        </>
      )}
    </Sheet>
  );
}
