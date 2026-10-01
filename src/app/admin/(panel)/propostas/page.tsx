"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check as IconCheck, Copy as IconCopy, FileText as IconDoc, Plus as IconPlus, Send as IconSend, X as IconClose } from "lucide-react";

import { MoneyInput } from "@/components/admin/job-bits";
import {
  Badge,
  Button,
  ChipSelect,
  DeleteButton,
  EmptyState,
  Field,
  List,
  PageHeader,
  Row,
  SearchBox,
  Section,
  Segmented,
  Sheet,
  useForm,
} from "@/components/admin/ui";
import { serviceTypeOptions } from "@/lib/admin/catalog";
import { brl, formatDate, proposalStatusLabel, proposalStatusTone } from "@/lib/admin/labels";
import {
  ITEM_PRESETS,
  UNITS,
  blankProposal,
  itemTotal,
  jobFromProposal,
  onlyDigits,
  proposalFromJob,
  proposalText,
  proposalTotals,
} from "@/lib/admin/proposals";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { Proposal, ProposalItem, ProposalStatus } from "@/lib/admin/types";
import { whatsappUrl } from "@/lib/order";

type Filter = "all" | "open" | ProposalStatus;
const NEW_CLIENT = "__novo";

export default function ProposalsPage() {
  const { rows, loading } = useTable("proposals");
  const { rows: clients } = useTable("clients");
  const { rows: jobs } = useTable("jobs");
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  // Atalhos: /admin/propostas?nova=1 e ?deServico=<jobId> (vem do serviço em orçamento)
  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("deServico");
    if (jobId) {
      const job = jobs.find((j) => j.id === jobId);
      if (job) setEditing(proposalFromJob(job, newId(), rows));
    } else if (params.has("nova")) setEditing(blankProposal(newId(), rows));
    // só na carga inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.name ?? "Sem cliente";
  const q = query.trim().toLowerCase();
  const filtered = rows
    .filter((p) => filter === "all" || (filter === "open" ? p.status === "draft" || p.status === "sent" : p.status === filter))
    .filter((p) => !q || `${p.number} ${p.title} ${clientName(p.clientId)}`.toLowerCase().includes(q))
    .sort((a, b) => b.number.localeCompare(a.number));

  const open = rows.filter((p) => p.status === "sent");
  const pipeline = open.reduce((s, p) => s + proposalTotals(p).total, 0);

  return (
    <>
      <PageHeader
        title="Propostas"
        subtitle="Orçamentos com numeração, itens e documento pronto para enviar."
        action={
          <Button onClick={() => setEditing(blankProposal(newId(), rows))}>
            <IconPlus className="size-4" /> Nova proposta
          </Button>
        }
      />

      {!loading && !rows.length ? (
        <EmptyState
          title="Nenhuma proposta ainda"
          text="Monte a primeira com itens, validade e condições. Ela vira um documento institucional em PDF."
          action={<Button onClick={() => setEditing(blankProposal(newId(), rows))}>Nova proposta</Button>}
        />
      ) : (
        <>
          {open.length > 0 && (
            <p className="mb-5 px-1 text-[0.9375rem] text-muted">
              <span className="num font-medium text-text">{open.length}</span> enviada(s) aguardando resposta ·{" "}
              <span className="num font-medium text-text">{brl.format(pipeline)}</span> em negociação
            </p>
          )}
          <div className="mb-4">
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "Todas" },
                { value: "open", label: "Em aberto" },
                { value: "accepted", label: "Aceitas" },
                { value: "declined", label: "Recusadas" },
                { value: "expired", label: "Expiradas" },
              ]}
            />
          </div>
          <SearchBox value={query} onChange={setQuery} placeholder="Buscar por número, título ou cliente" />
          {filtered.length ? (
            <List>
              {filtered.map((p) => (
                <Row
                  key={p.id}
                  onClick={() => setEditing(p)}
                  leading={<span className="num grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-navy-2 text-xs font-semibold text-silver">{p.number}</span>}
                  title={p.title || "Sem título"}
                  subtitle={`${clientName(p.clientId)} · válida até ${formatDate(p.validUntil)}`}
                  trailing={
                    <span className="flex flex-col items-end gap-1">
                      <span className="num font-medium">{brl.format(proposalTotals(p).total)}</span>
                      <Badge tone={proposalStatusTone(p.status)}>{proposalStatusLabel[p.status]}</Badge>
                    </span>
                  }
                />
              ))}
            </List>
          ) : (
            <p className="mt-6 text-center text-muted">Nenhuma proposta neste filtro.</p>
          )}
        </>
      )}

      {editing && <ProposalSheet proposal={editing} isNew={!rows.some((r) => r.id === editing.id)} onClose={() => setEditing(null)} />}
    </>
  );
}

function ProposalSheet(props: { proposal: Proposal; isNew: boolean; onClose: () => void }) {
  const { value: p, set } = useForm(props.proposal);
  const { rows: clients } = useTable("clients");
  const [clientChoice, setClientChoice] = useState(props.proposal.clientId ?? "");
  const [newClient, setNewClient] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [preset, setPreset] = useState("");

  const client = clients.find((c) => c.id === clientChoice) ?? null;
  const totals = proposalTotals(p);
  const text = useMemo(() => proposalText(p, client), [p, client]);

  const updateItem = (id: string, patch: Partial<ProposalItem>) => set("items", p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const removeItem = (id: string) => set("items", p.items.filter((i) => i.id !== id));
  const addItem = (presetLabel = "") => {
    const found = ITEM_PRESETS.find((x) => x.label === presetLabel)?.item;
    set("items", [...p.items, { id: newId(), unitPrice: 0, ...(found ?? { description: "", detail: "", qty: 1, unit: "un." }) }]);
    setPreset("");
  };

  // Resolve "+ Novo cliente" e grava
  async function persist(extra: Partial<Proposal> = {}): Promise<Proposal | null> {
    if (!p.title.trim()) {
      setError("Dê um título à proposta.");
      return null;
    }
    if (clientChoice === NEW_CLIENT && !newClient.trim()) {
      setError("Informe o nome do novo cliente.");
      return null;
    }
    let clientId = clientChoice || null;
    if (clientChoice === NEW_CLIENT) {
      clientId = newId();
      await repo.upsert("clients", { id: clientId, name: newClient.trim(), company: "", phone: "", email: "", language: null, notes: "", createdAt: new Date().toISOString() });
      setClientChoice(clientId);
    }
    const saved: Proposal = {
      ...p,
      ...extra,
      clientId,
      title: p.title.trim(),
      items: p.items.filter((i) => i.description.trim()).map((i) => ({ ...i, description: i.description.trim() })),
    };
    await repo.upsert("proposals", saved);
    return saved;
  }

  const save = async () => {
    if (await persist()) props.onClose();
  };
  const remove = async () => {
    await repo.remove("proposals", p.id);
    props.onClose();
  };

  // Salva e abre o documento em outra aba
  const openDocument = async () => {
    const saved = await persist();
    if (saved) window.open(`${process.env.NEXT_PUBLIC_BASE_PATH}/admin/propostas/documento?id=${saved.id}`, "_blank", "noopener");
  };

  // Salva como "Enviada" e abre o WhatsApp do cliente com o resumo
  const sendWhatsApp = async () => {
    const saved = await persist({ status: p.status === "draft" ? "sent" : p.status });
    if (!saved) return;
    set("status", saved.status);
    const phone = onlyDigits(client?.phone ?? "");
    const target = phone ? (phone.length <= 11 ? `55${phone}` : phone) : "";
    window.open(target ? whatsappUrl(target, text) : `https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o texto:", text);
    }
  };

  // Aceita → cria o serviço agendado com o valor fechado
  const accept = async () => {
    const saved = await persist({ status: "accepted" });
    if (!saved) return;
    if (!saved.jobId) {
      const job = jobFromProposal(saved, newId());
      await repo.upsert("jobs", job);
      await repo.upsert("proposals", { ...saved, jobId: job.id });
    } else {
      const job = (await repo.list("jobs")).find((j) => j.id === saved.jobId);
      if (job && job.status === "quote") await repo.upsert("jobs", { ...job, status: "scheduled", price: totals.total });
    }
    props.onClose();
  };

  return (
    <Sheet
      open
      error={error}
      onClose={props.onClose}
      title={props.isNew ? `Proposta ${p.number}` : `Proposta ${p.number} · ${p.title || "Sem título"}`}
      footer={
        <>
          {!props.isNew && <DeleteButton onConfirm={remove} />}
          <Button className="ml-auto" onClick={save}>
            Salvar
          </Button>
        </>
      }
    >
      {/* Ações principais ficam no topo: o Gabriel abre a proposta pra enviar, não pra editar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={openDocument}>
          <IconDoc className="size-4" /> Documento / PDF
        </Button>
        <Button variant="secondary" onClick={sendWhatsApp}>
          <IconSend className="size-4" /> WhatsApp
        </Button>
        <Button variant="secondary" onClick={copy}>
          {copied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />} {copied ? "Copiado" : "Copiar texto"}
        </Button>
        {p.status !== "accepted" && (
          <Button variant="ghost" onClick={accept}>
            <IconCheck className="size-4" /> Marcar aceita e agendar
          </Button>
        )}
      </div>

      <Field label="Status">
        <Segmented
          value={p.status}
          onChange={(v) => set("status", v)}
          options={(Object.keys(proposalStatusLabel) as ProposalStatus[]).map((s) => ({ value: s, label: proposalStatusLabel[s] }))}
        />
      </Field>

      <Field label="Título" hint="Aparece no topo do documento. Ex.: Proteção executiva · Visita da diretoria">
        <input className="input" value={p.title} onChange={(e) => set("title", e.target.value)} autoFocus={props.isNew && !p.title} />
      </Field>

      <Field label="Cliente">
        <select className="input" value={clientChoice} onChange={(e) => setClientChoice(e.target.value)}>
          <option value="">Sem cliente</option>
          {[...clients]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` · ${c.company}` : ""}
              </option>
            ))}
          <option value={NEW_CLIENT}>+ Novo cliente…</option>
        </select>
      </Field>
      {clientChoice === NEW_CLIENT && (
        <Field label="Nome do novo cliente">
          <input className="input" value={newClient} onChange={(e) => setNewClient(e.target.value)} autoFocus />
        </Field>
      )}
      {client && !client.phone && (
        <p className="-mt-3 text-xs text-muted">
          Este cliente não tem telefone cadastrado: o WhatsApp abre sem destinatário.{" "}
          <Link href="/admin/clientes" className="text-accent">
            Completar cadastro
          </Link>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Emitida em">
          <input className="input" type="date" value={p.issuedAt} onChange={(e) => set("issuedAt", e.target.value)} />
        </Field>
        <Field label="Válida até">
          <input className="input" type="date" value={p.validUntil} min={p.issuedAt} onChange={(e) => set("validUntil", e.target.value)} />
        </Field>
      </div>

      <Section title="Escopo">
        <div className="space-y-4">
          <Field label="Serviços">
            <ChipSelect options={serviceTypeOptions} value={p.serviceIds} onChange={(v) => set("serviceIds", v)} empty="" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Período">
              <input className="input" value={p.period} onChange={(e) => set("period", e.target.value)} placeholder="10 a 15 de outubro, 8h às 20h" />
            </Field>
            <Field label="Local / trajeto">
              <input className="input" value={p.location} onChange={(e) => set("location", e.target.value)} placeholder="São Paulo · SP" />
            </Field>
          </div>
          <Field label="Descrição do escopo" hint="Contexto da operação, em 2 ou 3 frases. Vai para o documento.">
            <textarea className="input resize-none" rows={3} value={p.summary} onChange={(e) => set("summary", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section
        title="Itens"
        action={
          <select
            className="input !min-h-9 !w-auto !py-1 !text-[0.875rem]"
            value={preset}
            onChange={(e) => addItem(e.target.value)}
            aria-label="Adicionar item do catálogo"
          >
            <option value="">+ Adicionar item…</option>
            {ITEM_PRESETS.map((x) => (
              <option key={x.label} value={x.label}>
                {x.label}
              </option>
            ))}
            <option value="__blank">Item em branco</option>
          </select>
        }
      >
        {p.items.length ? (
          <ul className="space-y-3">
            {p.items.map((i) => (
              <li key={i.id} className="space-y-3 rounded-2xl border border-line p-4">
                <div className="flex gap-2">
                  <input className="input" value={i.description} onChange={(e) => updateItem(i.id, { description: e.target.value })} placeholder="Descrição" aria-label="Descrição do item" />
                  <button
                    type="button"
                    onClick={() => removeItem(i.id)}
                    aria-label="Remover item"
                    className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-white/6 hover:text-danger"
                  >
                    <IconClose className="size-4" />
                  </button>
                </div>
                <input className="input !min-h-10 !text-[0.875rem]" value={i.detail} onChange={(e) => updateItem(i.id, { detail: e.target.value })} placeholder="Detalhe (ex.: 2 agentes · até 12h)" aria-label="Detalhe do item" />
                <div className="grid grid-cols-[4.5rem_1fr_1fr] gap-2 sm:grid-cols-[4.5rem_7rem_1fr_auto] sm:items-center">
                  <input
                    className="input num"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={i.qty}
                    onChange={(e) => updateItem(i.id, { qty: Math.max(0, Number(e.target.value) || 0) })}
                    aria-label="Quantidade"
                  />
                  <select className="input" value={i.unit} onChange={(e) => updateItem(i.id, { unit: e.target.value })} aria-label="Unidade">
                    {[...new Set([...UNITS, i.unit])].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <MoneyInput value={i.unitPrice} onChange={(v) => updateItem(i.id, { unitPrice: v })} label="Valor unitário" />
                  <span className="num col-span-3 text-right text-[0.9375rem] font-medium sm:col-span-1 sm:min-w-24">{brl.format(itemTotal(i))}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[0.9375rem] text-muted">Escolha um item do catálogo acima ou crie um em branco. Quantidade × valor unitário.</p>
        )}

        <dl className="mt-4 space-y-2 rounded-2xl bg-navy/60 p-4 text-[0.9375rem]">
          <div className="flex justify-between text-muted">
            <dt>Subtotal</dt>
            <dd className="num">{brl.format(totals.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 text-muted">
            <dt>Desconto</dt>
            <dd className="w-40">
              <MoneyInput value={p.discount} onChange={(v) => set("discount", v)} label="Desconto" />
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-lg font-semibold">
            <dt>Total</dt>
            <dd className="num">{brl.format(totals.total)}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Condições">
        <div className="space-y-4">
          <Field label="Pagamento">
            <textarea className="input resize-none" rows={2} value={p.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
          </Field>
          <Field label="Condições gerais" hint="Uma por linha. Viram a lista numerada do documento.">
            <textarea className="input resize-none" rows={5} value={p.terms} onChange={(e) => set("terms", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Field label="Observações internas" hint="Não aparecem no documento nem no WhatsApp.">
        <textarea className="input resize-none" rows={2} value={p.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
    </Sheet>
  );
}
