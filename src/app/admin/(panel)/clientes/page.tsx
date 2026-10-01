"use client";

import { useState } from "react";
import { Plus as IconPlus } from "lucide-react";

import { Avatar, Badge, Button, DeleteButton, EmptyState, Field, List, PageHeader, Row, SearchBox, Section, Sheet, useForm } from "@/components/admin/ui";
import { serviceTypeName } from "@/lib/admin/catalog";
import { countsAsRevenue } from "@/lib/admin/finance";
import { brl, clientLanguageLabel, formatDate, formatDateTime, jobStatusLabel, proposalStatusLabel, proposalStatusTone } from "@/lib/admin/labels";
import { proposalTotals } from "@/lib/admin/proposals";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { Client, Job } from "@/lib/admin/types";

const blank = (): Client => ({
  id: newId(),
  name: "",
  company: "",
  phone: "",
  email: "",
  language: "pt",
  notes: "",
  createdAt: new Date().toISOString(),
});

export default function ClientsPage() {
  const { rows, loading } = useTable("clients");
  const { rows: jobs } = useTable("jobs");
  const [editing, setEditing] = useState<Client | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = rows
    .filter((c) => !q || `${c.name} ${c.company} ${c.email} ${c.phone}`.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro e histórico de serviços de cada cliente."
        action={
          <Button onClick={() => setEditing(blank())}>
            <IconPlus className="size-4" /> Novo cliente
          </Button>
        }
      />
      {!loading && !rows.length ? (
        <EmptyState title="Nenhum cliente ainda" text="Os clientes também podem ser criados ao registrar um serviço." />
      ) : (
        <>
          <SearchBox value={query} onChange={setQuery} placeholder="Buscar por nome, empresa, e-mail ou telefone" />
          <List>
            {filtered.map((c) => {
              const mine = jobs.filter((j) => j.clientId === c.id && countsAsRevenue(j));
              return (
                <Row
                  key={c.id}
                  onClick={() => setEditing(c)}
                  leading={<Avatar name={c.name} />}
                  title={c.name}
                  subtitle={[c.company, c.phone || c.email].filter(Boolean).join(" · ") || "Sem contato"}
                  trailing={
                    <span className="flex flex-col items-end">
                      <span className="num font-medium">{brl.format(mine.reduce((s, j) => s + j.price, 0))}</span>
                      <span className="num text-xs text-muted">{mine.length} serviço(s)</span>
                    </span>
                  }
                />
              );
            })}
          </List>
          {!filtered.length && <p className="mt-6 text-center text-muted">Nenhum cliente encontrado.</p>}
        </>
      )}
      {editing && (
        <ClientSheet
          client={editing}
          isNew={!rows.some((r) => r.id === editing.id)}
          history={jobs.filter((j) => j.clientId === editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function ClientSheet(props: { client: Client; isNew: boolean; history: Job[]; onClose: () => void }) {
  const { value: c, set } = useForm(props.client);
  const { rows: proposals } = useTable("proposals");
  const [error, setError] = useState("");
  const mineProposals = proposals.filter((p) => p.clientId === c.id).sort((a, b) => b.number.localeCompare(a.number));
  const history = [...props.history].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const billed = history.filter(countsAsRevenue).reduce((s, j) => s + j.price, 0);

  const save = async () => {
    if (!c.name.trim()) return setError("Informe o nome.");
    await repo.upsert("clients", { ...c, name: c.name.trim() });
    props.onClose();
  };
  const remove = async () => {
    await repo.remove("clients", c.id);
    props.onClose();
  };

  return (
    <Sheet
      open
      error={error}
      onClose={props.onClose}
      title={props.isNew ? "Novo cliente" : c.name || "Cliente"}
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
        <input className="input" value={c.name} onChange={(e) => set("name", e.target.value)} autoFocus={props.isNew} />
      </Field>
      <Field label="Empresa">
        <input className="input" value={c.company} onChange={(e) => set("company", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefone / WhatsApp">
          <input className="input" type="tel" value={c.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="E-mail">
          <input className="input" type="email" value={c.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
      </div>
      <Field label="Idioma de atendimento">
        <select className="input" value={c.language ?? ""} onChange={(e) => set("language", (e.target.value || null) as Client["language"])}>
          <option value="">Não informado</option>
          {Object.entries(clientLanguageLabel).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Observações" hint="Preferências, restrições, quem indicou…">
        <textarea className="input resize-none" rows={3} value={c.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>

      {!props.isNew && mineProposals.length > 0 && (
        <Section title="Propostas">
          <List>
            {mineProposals.map((p) => (
              <Row
                key={p.id}
                title={`${p.number} · ${p.title || "Sem título"}`}
                subtitle={`Válida até ${formatDate(p.validUntil)}`}
                trailing={
                  <span className="flex flex-col items-end gap-1">
                    <span className="num text-[0.9375rem] font-medium">{brl.format(proposalTotals(p).total)}</span>
                    <Badge tone={proposalStatusTone(p.status)}>{proposalStatusLabel[p.status]}</Badge>
                  </span>
                }
              />
            ))}
          </List>
        </Section>
      )}

      {!props.isNew && (
        <Section title={`Histórico · ${brl.format(billed)}`}>
          {history.length ? (
            <List>
              {history.map((j) => (
                <Row
                  key={j.id}
                  title={serviceTypeName(j.serviceTypeId)}
                  subtitle={[formatDateTime(j.startsAt), j.destination].filter(Boolean).join(" · ")}
                  trailing={
                    <span className="flex flex-col items-end gap-1">
                      <span className="num text-[0.9375rem] font-medium">{brl.format(j.price)}</span>
                      <Badge tone={j.status === "done" ? "good" : j.status === "canceled" ? "bad" : "neutral"}>{jobStatusLabel[j.status]}</Badge>
                    </span>
                  }
                />
              ))}
            </List>
          ) : (
            <p className="text-[0.9375rem] text-muted">Nenhum serviço registrado para este cliente.</p>
          )}
        </Section>
      )}
    </Sheet>
  );
}
