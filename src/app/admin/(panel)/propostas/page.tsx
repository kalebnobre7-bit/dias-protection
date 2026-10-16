"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check as IconCheck, Copy as IconCopy, FileCheck as IconDocClosed, FileText as IconDoc, Minus as IconMinus, Plus as IconPlus, Send as IconSend, Sparkles as IconMagic, X as IconClose } from "lucide-react";

import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { FreelanceForm } from "@/components/admin/FreelanceForm";
import { MoneyInput, NumberTile } from "@/components/admin/job-bits";
import { PricingCalculator } from "@/components/admin/PricingCalculator";
import {
  Avatar,
  Badge,
  Button,
  ChipSelect,
  DeleteButton,
  EmptyState,
  Field,
  List,
  NumberInput,
  PageHeader,
  Row,
  SearchBox,
  Section,
  Segmented,
  Sheet,
  Skeleton,
  Switch,
  TextArea,
  useForm,
} from "@/components/admin/ui";
import { serviceTypeOptions, vehicleCategoryName } from "@/lib/admin/catalog";
import { brl, formatDate, proposalStatusLabel, proposalStatusTone } from "@/lib/admin/labels";
import { blankPricing, pricingResult } from "@/lib/admin/pricing";
import {
  blankProposal,
  itemTotal,
  jobFromProposal,
  mergeScopeItems,
  onlyDigits,
  periodText,
  proposalFromJob,
  proposalText,
  proposalTotals,
  scopeItems,
  scopeSummary,
} from "@/lib/admin/proposals";
import { useSettings } from "@/lib/admin/settings";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { Proposal, ProposalItem, ProposalStatus } from "@/lib/admin/types";
import { whatsappUrl } from "@/lib/order";

type Filter = "all" | "open" | ProposalStatus;
const NEW_CLIENT = "__novo";

export default function ProposalsPage() {
  const { rows, loading } = useTable("proposals");
  const { rows: clients } = useTable("clients");
  const { rows: jobs } = useTable("jobs");
  const { settings, loading: settingsLoading } = useSettings();
  const blank = () => blankProposal(newId(), rows, settings.proposal);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  // Atalhos: /admin/propostas?nova=1, ?id=<proposalId> (vem do Início) e ?deServico=<jobId> (vem do serviço em orçamento)
  useEffect(() => {
    if (loading || settingsLoading) return;
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("deServico");
    const existing = rows.find((p) => p.id === params.get("id"));
    if (existing) setEditing(existing);
    else if (jobId) {
      const job = jobs.find((j) => j.id === jobId);
      if (job) setEditing(proposalFromJob(job, newId(), rows, settings.proposal));
    } else if (params.has("nova")) setEditing(blank());
    // só na carga inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, settingsLoading]);

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
          <Button disabled={loading} onClick={() => setEditing(blank())}>
            <IconPlus className="size-4" /> Nova proposta
          </Button>
        }
      />

      {loading ? (
        <Skeleton />
      ) : !rows.length ? (
        <EmptyState
          title="Nenhuma proposta ainda"
          text="Monte a primeira com itens, validade e condições. Ela vira um documento institucional em PDF."
          action={<Button onClick={() => setEditing(blank())}>Nova proposta</Button>}
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
                  leading={<NumberTile number={p.number} />}
                  title={p.title || "Sem título"}
                  subtitle={`${clientName(p.clientId)} · até ${formatDate(p.validUntil)}`}
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
  const { value: p, set, dirty } = useForm(props.proposal);
  const { rows: clients } = useTable("clients");
  const [clientChoice, setClientChoice] = useState(props.proposal.clientId ?? "");
  const [newClient, setNewClient] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [preset, setPreset] = useState("");
  const [tab, setTab] = useState<"proposal" | "price" | "team" | "vehicles">("proposal");
  const { rows: agents } = useTable("agents");
  const { rows: vehicles } = useTable("vehicles");
  const toggleIn = (key: "agentIds" | "vehicleIds", id: string) =>
    set(key, p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id]);

  const client = clients.find((c) => c.id === clientChoice) ?? null;
  const totals = proposalTotals(p);
  const { settings } = useSettings();
  const { presets, units } = settings.proposal;
  const text = useMemo(() => proposalText(p, client, settings.company), [p, client, settings.company]);

  const updateItem = (id: string, patch: Partial<ProposalItem>) => set("items", p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const removeItem = (id: string) => set("items", p.items.filter((i) => i.id !== id));
  const addItem = (choice: string) => {
    const found = /^\d+$/.test(choice) ? presets[Number(choice)] : undefined; // índice do catálogo ou "__blank"
    set("items", [...p.items, { id: newId(), qty: 1, ...(found ?? { description: "", detail: "", unit: units[0] ?? "un.", unitPrice: 0 }) }]);
    setPreset("");
  };

  // Calculadora → total da proposta: cria o item se não houver, ou acerta o valor do item único
  const price = p.pricing ? pricingResult(p.pricing).price : null;
  const priceTarget = price === null ? null : Math.round((price + p.discount) * 100) / 100;
  const priceMatches = priceTarget !== null && Math.abs(totals.total - (priceTarget - p.discount)) < 0.05;
  const applyPrice = () => {
    if (priceTarget === null) return;
    if (!p.items.length) set("items", [{ id: newId(), description: p.title.trim() || "Serviço", detail: "", qty: 1, unit: "un.", unitPrice: priceTarget }]);
    else if (p.items.length === 1) {
      const qty = p.items[0].qty || 1;
      set("items", [{ ...p.items[0], qty, unitPrice: Math.round((priceTarget / qty) * 100) / 100 }]);
    }
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
    try {
      let clientId = clientChoice || null;
      if (clientChoice === NEW_CLIENT) {
        clientId = newId();
        await repo.upsert("clients", { id: clientId, name: newClient.trim(), company: "", phone: "", email: "", language: null, representatives: [], notes: "", createdAt: new Date().toISOString() });
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      return null;
    }
  }

  const save = async () => {
    if (await persist()) props.onClose();
  };
  const remove = async () => {
    try {
      await repo.remove("proposals", p.id);
      props.onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
  };

  // Salva e abre o documento em outra aba (comercial ou serviço fechado)
  const openDocument = async (closed: boolean) => {
    const saved = await persist();
    if (saved)
      window.open(`${process.env.NEXT_PUBLIC_BASE_PATH}/admin/propostas/documento?id=${saved.id}${closed ? "&modo=fechado" : ""}`, "_blank", "noopener");
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
    try {
      if (!saved.jobId) {
        const job = jobFromProposal(saved, newId());
        await repo.upsert("jobs", job);
        await repo.upsert("proposals", { ...saved, jobId: job.id });
      } else {
        const job = (await repo.list("jobs")).find((j) => j.id === saved.jobId);
        if (job && job.status === "quote") await repo.upsert("jobs", { ...job, status: "scheduled", price: totals.total });
      }
      props.onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar o serviço.");
    }
  };

  return (
    <Sheet
      open
      error={error}
      dirty={dirty}
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
        <Button variant="secondary" onClick={() => openDocument(false)}>
          <IconDoc className="size-4" /> Proposta comercial
        </Button>
        <Button variant="secondary" onClick={() => openDocument(true)}>
          <IconDocClosed className="size-4" /> Serviço fechado
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

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "proposal", label: "Proposta" },
          { value: "price", label: "Preço" },
          { value: "team", label: `Equipe${p.agentIds.length ? ` · ${p.agentIds.length}` : ""}` },
          { value: "vehicles", label: `Veículos${p.vehicleIds.length ? ` · ${p.vehicleIds.length}` : ""}` },
        ]}
      />

      {tab === "proposal" && (
        <>
        <Field label="Status">
          <Segmented
            value={p.status}
            onChange={(v) => set("status", v)}
            // "Aceita" só pelo botão "Marcar aceita e agendar", que também cria o serviço
            options={(Object.keys(proposalStatusLabel) as ProposalStatus[])
              .filter((s) => s !== "accepted" || p.status === "accepted")
              .map((s) => ({ value: s, label: proposalStatusLabel[s] }))}
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

        <Section title="Escopo">
          <div className="space-y-4">
            {/* Primeiro a operação (natureza, datas, seguranças); os itens saem daqui */}
            <Field label="Natureza do serviço">
              <Segmented
                value={p.nature}
                onChange={(v) => set("nature", v)}
                options={[
                  { value: "daily", label: "Diária" },
                  { value: "transfer", label: "Transfer" },
                ]}
              />
            </Field>
            <div>
              <span className="mb-1.5 block text-[0.875rem] font-medium text-silver">Período</span>
              <DateRangePicker
                start={p.startDate}
                end={p.endDate}
                onChange={(start, end) => {
                  set("startDate", start);
                  set("endDate", end);
                  set("period", periodText(start, end));
                }}
              />
            </div>
            <Field label="Período no documento" hint="Preenchido pelo calendário. Dá pra completar com horário.">
              <input className="input" value={p.period} onChange={(e) => set("period", e.target.value)} placeholder="10 a 15 de outubro, 8h às 20h" />
            </Field>
            <div className="rounded-2xl border border-line px-4 py-2">
              <Switch checked={p.guards > 0} onChange={(v) => set("guards", v ? 1 : 0)} label="Com segurança" hint="Agentes de proteção junto com o transporte" />
              {p.guards > 0 && (
                <div className="flex items-center justify-between gap-4 border-t border-line py-3">
                  <span className="font-medium">Número de seguranças</span>
                  <span className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => set("guards", Math.max(1, p.guards - 1))}
                      aria-label="Menos um segurança"
                      className="grid size-9 place-items-center rounded-full border border-line-strong hover:border-silver"
                    >
                      <IconMinus className="size-4" />
                    </button>
                    <span className="num w-6 text-center text-lg font-semibold">{p.guards}</span>
                    <button
                      type="button"
                      onClick={() => set("guards", Math.min(30, p.guards + 1))}
                      aria-label="Mais um segurança"
                      className="grid size-9 place-items-center rounded-full border border-line-strong hover:border-silver"
                    >
                      <IconPlus className="size-4" />
                    </button>
                  </span>
                </div>
              )}
            </div>
            <Field label="Local / trajeto">
              <input className="input" value={p.location} onChange={(e) => set("location", e.target.value)} placeholder="São Paulo · SP" />
            </Field>
            <Field label="Serviços">
              <ChipSelect options={serviceTypeOptions} value={p.serviceIds} onChange={(v) => set("serviceIds", v)} empty="" />
            </Field>
            <Field label="Descrição do escopo" hint="Contexto da operação, em 2 ou 3 frases. Vai para o documento.">
              <TextArea rows={3} value={p.summary} onChange={(e) => set("summary", e.target.value)} />
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
              {presets.map((x, n) => (
                <option key={n} value={n}>
                  {x.description}
                </option>
              ))}
              <option value="__blank">Item em branco</option>
            </select>
          }
        >
          {scopeItems(p).length > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-3">
              <span className="text-[0.875rem] text-muted">Escopo: {scopeSummary(p)}</span>
              <Button variant="secondary" className="!min-h-9 !px-3" onClick={() => set("items", mergeScopeItems(p, newId))}>
                <IconMagic className="size-4" /> {p.items.length ? "Refazer itens do escopo" : "Gerar itens do escopo"}
              </Button>
            </div>
          )}
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
                  {/* quantidade · unidade × valor unitário = total; quebra linha no celular */}
                  <div className="flex flex-wrap items-center gap-2">
                    <NumberInput value={i.qty} onChange={(v) => updateItem(i.id, { qty: v ?? 0 })} fallback={0} digits={3} label="Quantidade" />
                    <select className="input !w-auto" value={i.unit} onChange={(e) => updateItem(i.id, { unit: e.target.value })} aria-label="Unidade">
                      {[...new Set([...units, i.unit])].map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted" aria-hidden>
                      ×
                    </span>
                    <MoneyInput value={i.unitPrice} onChange={(v) => updateItem(i.id, { unitPrice: v })} label="Valor unitário" className="min-w-[8.5rem] flex-1" />
                    <span className="num ml-auto min-w-24 text-right text-[0.9375rem] font-medium">{brl.format(itemTotal(i))}</span>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emitida em">
            <input className="input" type="date" value={p.issuedAt} onChange={(e) => set("issuedAt", e.target.value)} />
          </Field>
          <Field label="Válida até">
            <input className="input" type="date" value={p.validUntil} min={p.issuedAt} onChange={(e) => set("validUntil", e.target.value)} />
          </Field>
        </div>

        <Section title="Condições">
          <div className="space-y-4">
            <Field label="Pagamento">
              <TextArea rows={3} value={p.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
            </Field>
            <Field label="Condições gerais" hint="Uma por linha. Viram a lista numerada do documento.">
              <TextArea rows={5} value={p.terms} onChange={(e) => set("terms", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Field label="Observações internas" hint="Não aparecem no documento nem no WhatsApp.">
          <TextArea rows={2} value={p.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
        </>
      )}

      {tab === "price" &&
        (p.pricing ? (
          <>
            <PricingCalculator value={p.pricing} onChange={(v) => set("pricing", v)} />
            <div className="space-y-3 rounded-2xl border border-line p-4 text-[0.9375rem]">
              <p className="flex justify-between gap-4">
                <span className="text-muted">Total da proposta</span>
                <span className="num font-medium">{brl.format(totals.total)}</span>
              </p>
              {priceMatches ? (
                <p className="flex items-center gap-2 text-accent">
                  <IconCheck className="size-4" /> O total da proposta bate com o preço calculado.
                </p>
              ) : p.items.length > 1 ? (
                <p className="text-muted">Com mais de um item, ajuste os valores na aba Proposta até chegar ao preço calculado.</p>
              ) : (
                <Button variant="secondary" onClick={applyPrice} disabled={priceTarget === null}>
                  Usar o preço calculado na proposta
                </Button>
              )}
            </div>
            <p className="text-xs text-muted">Interno: custos e margem não aparecem no documento nem no WhatsApp.</p>
          </>
        ) : (
          <EmptyState
            title="Calcule o preço desta proposta"
            text="Custos, margem e impostos da planilha de precificação. Fica salvo só aqui, o cliente não vê."
            action={<Button onClick={() => set("pricing", blankPricing())}>Começar pela planilha</Button>}
          />
        ))}

      {tab === "team" && (
        <>
          <PickList
            hint="Motoristas e seguranças apresentados no documento. Na proposta comercial vão foto e bio; no serviço fechado, currículo, contato e CNH."
            empty="Cadastre a equipe em Agentes."
            items={agents
              .filter((a) => a.active || p.agentIds.includes(a.id))
              .map((a) => ({
                id: a.id,
                leading: <Avatar name={a.name} photo={a.photoUrl} />,
                title: a.name,
                subtitle: [a.freelance ? "Avulso" : "", a.rolePt, a.languages.join(", ")].filter(Boolean).join(" · ") || "Sem função",
                warn: a.cnhUrl ? "" : "Sem CNH",
              }))}
            selected={p.agentIds}
            onToggle={(id) => toggleIn("agentIds", id)}
          />
          <FreelanceForm onAdded={(id) => set("agentIds", [...p.agentIds, id])} />
        </>
      )}

      {tab === "vehicles" && (
        <PickList
          hint="Veículos apresentados no documento com foto, categoria, modelo e ano. A placa só aparece no serviço fechado."
          empty="Cadastre os veículos em Veículos."
          items={vehicles
            .filter((v) => v.active || p.vehicleIds.includes(v.id))
            .map((v) => ({
              id: v.id,
              leading: v.photoUrl ? (
                <img src={v.photoUrl} alt="" className="h-10 w-14 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="h-10 w-14 shrink-0 rounded-lg bg-navy-2" />
              ),
              title: v.model,
              subtitle: [vehicleCategoryName(v.categoryId), v.year, v.color].filter(Boolean).join(" · "),
              warn: v.photoUrl ? "" : "Sem foto",
            }))}
          selected={p.vehicleIds}
          onToggle={(id) => toggleIn("vehicleIds", id)}
        />
      )}
    </Sheet>
  );
}

// Lista de seleção da equipe e dos veículos da proposta
function PickList(props: {
  hint: string;
  empty: string;
  items: { id: string; leading: React.ReactNode; title: string; subtitle: string; warn: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (!props.items.length) return <EmptyState title="Nada cadastrado" text={props.empty} />;
  return (
    <div className="space-y-3">
      <p className="px-1 text-[0.875rem] text-muted">{props.hint}</p>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-navy/60">
        {props.items.map((i) => {
          const on = props.selected.includes(i.id);
          return (
            <li key={i.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => props.onToggle(i.id)}
                className="flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left transition-colors duration-200 hover:bg-navy-2"
              >
                {i.leading}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{i.title}</span>
                  <span className="mt-0.5 block truncate text-[0.875rem] text-muted">{i.subtitle}</span>
                </span>
                {i.warn && <Badge tone="warn">{i.warn}</Badge>}
                <span
                  aria-hidden
                  className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
                    on ? "border-[#34c759] bg-[#34c759] text-ink" : "border-line-strong"
                  }`}
                >
                  {on && <IconCheck className="size-3.5" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
