"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText as IconDoc, Plus as IconPlus, X as IconClose } from "lucide-react";

import {
  Badge,
  Button,
  buttonClass,
  ChipSelect,
  DaysField,
  Checkbox,
  DeleteButton,
  EmptyState,
  Field,
  List,
  PageHeader,
  Row,
  SearchBox,
  Section,
  Select,
  Segmented,
  Sheet,
  Skeleton,
  TextArea,
  useForm,
  cell,
  cellChild,
} from "@/components/admin/ui";
import { FreelanceForm } from "@/components/admin/FreelanceForm";
import { ShareLinks } from "@/components/admin/ShareLinks";
import { JobShifts } from "@/components/admin/JobShifts";
import { DateTile, MoneyInput, statusTone } from "@/components/admin/job-bits";
import { jobServiceNames, serviceTypeOptions } from "@/lib/admin/catalog";
import { monthOf, monthTaxRate } from "@/lib/admin/finance";
import { available, brl, byRank, clientLine, costCategoryName, formatDateTime, jobDatesText, jobStatusLabel, percent } from "@/lib/admin/labels";
import { defaultDueDate, jobDates } from "@/lib/admin/overtime";
import { useSettings } from "@/lib/admin/settings";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { AgentRecord, Job, JobCost, JobStatus } from "@/lib/admin/types";

type Filter = "all" | JobStatus;

const NEW_CLIENT = "__novo";

const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Serviço novo já começa amanhã às 08:00 (o mais comum); o Gabriel só ajusta
const tomorrowAt8 = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${localDate(d)}T08:00`;
};

const firstServiceType = serviceTypeOptions[0]?.value ?? null;

const blank = (): Job => ({
  id: newId(),
  clientId: null,
  serviceTypeId: firstServiceType,
  serviceTypeIds: firstServiceType ? [firstServiceType] : [],
  startsAt: tomorrowAt8(),
  endsAt: "",
  days: [],
  origin: "",
  destination: "",
  status: "scheduled",
  price: 0,
  paymentStatus: "pending",
  paidAt: "",
  notes: "",
  shifts: [],
  agentIds: [],
  vehicleIds: [],
  createdAt: new Date().toISOString(),
});

export default function JobsPage() {
  const { rows, loading } = useTable("jobs");
  const { rows: clients } = useTable("clients");
  const [editing, setEditing] = useState<Job | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  // Atalhos do Início e do Financeiro: /admin/servicos?novo=1 e ?id=<jobId>
  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    const job = rows.find((j) => j.id === params.get("id"));
    if (job) setEditing(job);
    else if (params.has("novo")) setEditing(blank());
    // só na carga inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const clientOf = (id: string | null) => clients.find((c) => c.id === id);
  const q = query.trim().toLowerCase();
  // "Todos" deixa os cancelados de fora; eles têm filtro próprio
  const filtered = rows
    .filter((j) => (filter === "all" ? j.status !== "canceled" : j.status === filter))
    .filter((j) => !q || `${clientLine(clientOf(j.clientId))} ${jobServiceNames(j)} ${j.origin} ${j.destination}`.toLowerCase().includes(q));
  // Próximos do mais perto ao mais longe; anteriores do mais recente ao mais antigo
  const today = localDate(new Date());
  const upcoming = filtered.filter((j) => j.startsAt.slice(0, 10) >= today).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = filtered.filter((j) => j.startsAt.slice(0, 10) < today).sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return (
    <>
      <PageHeader
        title="Serviços"
        subtitle="Cada serviço prestado: equipe, veículos, valor e custos."
        action={
          <Button onClick={() => setEditing(blank())}>
            <IconPlus className="size-4" /> Novo serviço
          </Button>
        }
      />
      {loading ? (
        <Skeleton />
      ) : !rows.length ? (
        <EmptyState title="Nenhum serviço registrado" text="Registre cada pedido confirmado pelo WhatsApp para montar o histórico e o financeiro." />
      ) : (
        <>
          <div className="mb-4">
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "Todos" },
                { value: "quote", label: "Orçamentos" },
                { value: "scheduled", label: "Agendados" },
                { value: "done", label: "Concluídos" },
                { value: "canceled", label: "Cancelados" },
              ]}
            />
          </div>
          <SearchBox value={query} onChange={setQuery} placeholder="Buscar por cliente, tipo ou local" />
          {filtered.length ? (
            <div className="space-y-8">
              {[
                { title: "Próximos", jobs: upcoming },
                { title: "Anteriores", jobs: past },
              ]
                .filter((g) => g.jobs.length)
                .map((g) => (
                  <Section key={g.title} title={`${g.title} · ${g.jobs.length}`}>
                    <List>
                      {g.jobs.map((j) => (
                        <Row
                          key={j.id}
                          onClick={() => setEditing(j)}
                          leading={<DateTile value={j.startsAt} />}
                          title={clientLine(clientOf(j.clientId))}
                          subtitle={[jobServiceNames(j), jobDatesText(j), j.destination].filter(Boolean).join(" · ")}
                          trailing={
                            <span className="flex flex-col items-end gap-1">
                              <span className="num font-medium">{brl.format(j.price)}</span>
                              <span className="flex gap-1">
                                {j.status !== "canceled" && j.status !== "quote" && j.paymentStatus === "pending" && <Badge tone="warn">A receber</Badge>}
                                <Badge tone={statusTone(j.status)}>{jobStatusLabel[j.status]}</Badge>
                              </span>
                            </span>
                          }
                        />
                      ))}
                    </List>
                  </Section>
                ))}
            </div>
          ) : (
            <p className="mt-6 text-center text-muted">Nenhum serviço neste filtro.</p>
          )}
        </>
      )}
      {editing && <JobSheet job={editing} isNew={!rows.some((r) => r.id === editing.id)} onClose={() => setEditing(null)} />}
    </>
  );
}

// Data e hora separadas: o datetime-local devolve "" enquanto falta a hora, e o término sumia ao salvar
function DateTimeFields(props: { label: string; value: string; defaultTime: string; onChange: (v: string) => void }) {
  const date = props.value.slice(0, 10);
  const time = props.value.slice(11, 16);
  return (
    <Field label={props.label}>
      <div className="flex gap-2">
        <input
          className="input min-w-0 flex-1"
          type="date"
          value={date}
          onChange={(e) => props.onChange(e.target.value ? `${e.target.value}T${time || props.defaultTime}` : "")}
        />
        <input
          className="input !w-28 shrink-0 disabled:opacity-50"
          type="time"
          aria-label={`Hora de ${props.label.toLowerCase()}`}
          value={time}
          disabled={!date}
          onChange={(e) => props.onChange(`${date}T${e.target.value || props.defaultTime}`)}
        />
      </div>
    </Field>
  );
}

const FIXED_COSTS = ["Agente", "Parceiro"];

// Edita as mesmas categorias de Configurações sem sair do serviço; renomear leva junto os custos já lançados
function CostCategoriesEditor(props: { onClose: () => void; onRenamed: (from: string, to: string) => void }) {
  const { settings } = useSettings();
  const [items, setItems] = useState<{ name: string; from: string | null }[]>(() => settings.costs.categories.map((name) => ({ name, from: name })));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const named = items.map((c) => ({ ...c, name: c.name.trim() })).filter((c) => c.name);
    const names = named.map((c) => c.name.toLowerCase());
    const clash = named.find((c, i) => names.indexOf(c.name.toLowerCase()) !== i || FIXED_COSTS.some((f) => f.toLowerCase() === c.name.toLowerCase()));
    if (clash) return setError(`Categoria repetida: ${clash.name}.`);
    setBusy(true);
    try {
      await repo.upsert("settings", { ...settings, costs: { ...settings.costs, categories: named.map((c) => c.name) } });
      for (const c of named) {
        if (c.from && c.from !== c.name) {
          await repo.renameCostCategory(c.from, c.name);
          props.onRenamed(c.from, c.name);
        }
      }
      props.onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 space-y-2 border-l-2 border-line-strong pl-4">
      <p className="text-[0.875rem] text-muted">Agente e Parceiro são fixos. O que mudar aqui vale para todos os serviços.</p>
      {items.map((c, n) => (
        <div key={n} className="flex items-center gap-1">
          <input
            className="input !min-h-9"
            value={c.name}
            aria-label="Nome da categoria"
            onChange={(e) => setItems(items.map((x, i) => (i === n ? { ...x, name: e.target.value } : x)))}
          />
          <button
            type="button"
            onClick={() => setItems(items.filter((_, i) => i !== n))}
            aria-label={`Remover categoria ${c.name}`}
            className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-white/6 hover:text-danger"
          >
            <IconClose className="size-4" />
          </button>
        </div>
      ))}
      {error && (
        <p role="alert" className="text-[0.875rem] text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" className="!min-h-9 !px-3" onClick={() => setItems([...items, { name: "", from: null }])}>
          <IconPlus className="size-4" /> Categoria
        </Button>
        <span className="flex gap-2">
          <Button variant="ghost" className="!min-h-9 !px-3" onClick={props.onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="secondary" className="!min-h-9 !px-3" onClick={save} disabled={busy}>
            {busy ? "Salvando…" : "Salvar categorias"}
          </Button>
        </span>
      </div>
    </div>
  );
}

function JobSheet(props: { job: Job; isNew: boolean; onClose: () => void }) {
  const { value: j, set, dirty } = useForm(props.job);
  const { rows: clients } = useTable("clients");
  const { rows: agents } = useTable("agents");
  const { rows: vehicles } = useTable("vehicles");
  const { rows: partners } = useTable("partners");
  const { rows: jobs } = useTable("jobs");
  const { categories: costCategories, paymentDays } = useSettings().settings.costs;
  const { rows: allCosts, loading: costsLoading } = useTable("jobCosts");
  const [costs, setCosts] = useState<JobCost[] | null>(null);
  const [newClient, setNewClient] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [clientChoice, setClientChoice] = useState(props.job.clientId ?? "");
  const [editingCategories, setEditingCategories] = useState(false);
  const [error, setError] = useState("");

  // Custos são editados localmente e gravados juntos no salvar
  useEffect(() => {
    if (costs === null && !costsLoading) setCosts(allCosts.filter((c) => c.jobId === props.job.id));
  }, [allCosts, costs, costsLoading, props.job.id]);
  const list = costs ?? [];
  const costsDirty = costs !== null && JSON.stringify(costs) !== JSON.stringify(allCosts.filter((c) => c.jobId === props.job.id));
  const totalCosts = list.reduce((s, c) => s + (Number.isFinite(c.amount) ? c.amount : 0), 0);
  const taxRate = monthTaxRate(monthOf(j.startsAt), jobs);
  const tax = j.price * taxRate;
  const profit = j.price - totalCosts - tax;

  // Vencimento padrão: último dia do serviço + prazo de Configurações
  const dueDefault = j.startsAt ? defaultDueDate(j, paymentDays ?? 15) : "";
  const updateCost = (id: string, patch: Partial<JobCost>) => setCosts(list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  // Escolher o agente preenche a descrição vazia ("Diária · Nome")
  const pickCostAgent = (c: JobCost, agentId: string) => {
    const name = agents.find((a) => a.id === agentId)?.name;
    updateCost(c.id, { agentId: agentId || null, ...(name && !c.description.trim() ? { description: `Diária · ${name}` } : {}) });
  };
  const addCost = () =>
    setCosts([
      ...list,
      { id: newId(), jobId: j.id, description: "", category: "agent", amount: 0, agentId: null, partnerId: null, paid: false, advance: 0, dueDate: "", overtimeHours: 0, vehicleId: null, createdAt: new Date().toISOString() },
    ]);

  const save = async () => {
    if (!j.startsAt) return setError("Informe a data e o horário de início.");
    if (clientChoice === NEW_CLIENT && !newClient.trim()) return setError("Informe o nome do novo cliente.");
    try {
      let clientId = clientChoice || null;
      if (clientChoice === NEW_CLIENT) {
        clientId = newId();
        await repo.upsert("clients", { id: clientId, name: newClient.trim(), company: newCompany.trim(), phone: "", email: "", language: null, representatives: [], notes: "", createdAt: new Date().toISOString() });
        setClientChoice(clientId); // se o resto falhar, salvar de novo não duplica o cliente
      }
      // Com dias avulsos, início e término acompanham o primeiro e o último dia
      const first = j.days[0];
      const last = j.days[j.days.length - 1];
      const dates = first ? { startsAt: first + j.startsAt.slice(10), endsAt: j.endsAt ? last + j.endsAt.slice(10) : "" } : {};
      const shiftDates = jobDates(j);
      await repo.upsert("jobs", { ...j, ...dates, clientId, shifts: j.shifts.filter((s) => shiftDates.includes(s.date)), paidAt: j.paymentStatus === "paid" ? j.paidAt || j.startsAt.slice(0, 10) : "" });
      await repo.replaceJobCosts(
        j.id,
        list.filter((c) => c.description.trim() || c.amount > 0).map((c) => ({ ...c, description: c.description.trim() || costCategoryName(c.category), dueDate: c.dueDate || (c.paid ? "" : dueDefault) })),
      );
      props.onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };
  const remove = async () => {
    try {
      await repo.remove("jobs", j.id);
      props.onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
  };

  // Mostra os ativos + os já escalados (mesmo que tenham ficado inativos)
  const teamOf = (kind: AgentRecord["kind"]) => agents.filter((a) => a.kind === kind && (available(a) || j.agentIds.includes(a.id))).sort(byRank);
  const teamOptions = (kind: AgentRecord["kind"]) => teamOf(kind).map((a) => ({ value: a.id, label: a.freelance ? `${a.name} (avulso)` : a.name }));
  const pickedOf = (kind: AgentRecord["kind"]) => j.agentIds.filter((id) => teamOf(kind).some((a) => a.id === id));
  // Agentes e motoristas ficam em agentIds; cada grupo de chips só troca os seus
  const setPicked = (kind: AgentRecord["kind"], picked: string[]) => set("agentIds", [...j.agentIds.filter((id) => !teamOf(kind).some((a) => a.id === id)), ...picked]);
  const vehicleOptions = vehicles
    .filter((v) => v.active || j.vehicleIds.includes(v.id))
    .map((v) => ({ value: v.id, label: [v.model, v.plate].filter(Boolean).join(" · ") }));

  return (
    <Sheet
      open
      error={error}
      dirty={dirty || costsDirty}
      onClose={props.onClose}
      title={props.isNew ? "Novo serviço" : `${jobServiceNames(j)} · ${formatDateTime(j.startsAt)}`}
      footer={
        <>
          {!props.isNew && <DeleteButton onConfirm={remove} />}
          <Button className="ml-auto" onClick={save}>
            Salvar
          </Button>
        </>
      }
    >
      <Field label="Status">
        <Segmented
          value={j.status}
          onChange={(v) => set("status", v)}
          options={(Object.keys(jobStatusLabel) as JobStatus[]).map((s) => ({ value: s, label: jobStatusLabel[s] }))}
        />
      </Field>
      {j.status === "quote" && !props.isNew && (
        <Link
          href={`/admin/propostas?deServico=${j.id}`}
          className={buttonClass("secondary")}
        >
          <IconDoc className="size-4" /> Gerar proposta a partir deste serviço
        </Link>
      )}

      <Field label="Cliente">
        <Select value={clientChoice} onChange={(e) => setClientChoice(e.target.value)}>
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
        </Select>
      </Field>
      {clientChoice === NEW_CLIENT && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente" hint="Os demais dados podem ser completados na aba Clientes.">
            <input className="input" value={newClient} onChange={(e) => setNewClient(e.target.value)} autoFocus />
          </Field>
          <Field label="Contratante">
            <input className="input" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
          </Field>
        </div>
      )}

      <Field label="Tipo de serviço" hint="Pode marcar mais de um.">
        <ChipSelect
          options={serviceTypeOptions}
          value={j.serviceTypeIds}
          onChange={(v) => {
            set("serviceTypeIds", v);
            set("serviceTypeId", v[0] ?? null); // o primeiro segue sendo o usado nos relatórios
          }}
          empty=""
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <DateTimeFields label="Início" value={j.startsAt} defaultTime="08:00" onChange={(v) => set("startsAt", v)} />
        <DateTimeFields label="Término (opcional)" value={j.endsAt} defaultTime="18:00" onChange={(v) => set("endsAt", v)} />
        <Field label="Origem">
          <input className="input" value={j.origin} onChange={(e) => set("origin", e.target.value)} />
        </Field>
        <Field label="Destino">
          <input className="input" value={j.destination} onChange={(e) => set("destination", e.target.value)} />
        </Field>
      </div>

      <DaysField days={j.days} seed={j.startsAt.slice(0, 10)} onChange={(days) => set("days", days)} />

      <Section title="Equipe e veículos">
        <div className="space-y-5">
          <Field label="Agentes">
            <ChipSelect options={teamOptions("agent")} value={pickedOf("agent")} onChange={(v) => setPicked("agent", v)} empty="Cadastre agentes na aba Agentes." />
          </Field>
          <FreelanceForm onAdded={(id) => set("agentIds", [...j.agentIds, id])} />
          <Field label="Motoristas">
            <ChipSelect options={teamOptions("driver")} value={pickedOf("driver")} onChange={(v) => setPicked("driver", v)} empty="Cadastre motoristas na aba Motoristas." />
          </Field>
          <FreelanceForm kind="driver" onAdded={(id) => set("agentIds", [...j.agentIds, id])} />
          <Field label="Veículos">
            <ChipSelect options={vehicleOptions} value={j.vehicleIds} onChange={(v) => set("vehicleIds", v)} empty="Cadastre veículos na aba Veículos." />
          </Field>
        </div>
      </Section>

      <Section title="Valor">
        <div className="space-y-4">
          <Field label="Valor cobrado">
            <MoneyInput value={j.price} onChange={(v) => set("price", v)} />
          </Field>
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Pagamento">
              <Segmented
                value={j.paymentStatus}
                onChange={(v) => {
                  set("paymentStatus", v);
                  if (v === "paid" && !j.paidAt) set("paidAt", localDate(new Date())); // recebido hoje, por padrão
                }}
                options={[
                  { value: "pending", label: "A receber" },
                  { value: "paid", label: "Recebido" },
                ]}
              />
            </Field>
            {j.paymentStatus === "paid" && (
              <Field label="Recebido em">
                <input className="input" type="date" value={j.paidAt} onChange={(e) => set("paidAt", e.target.value)} />
              </Field>
            )}
          </div>
        </div>
      </Section>

      {!props.isNew && (
        <ShareLinks
          title="Link de credenciamento"
          hint="Para a portaria do evento ou condomínio: foto, nome, função e documento da equipe salva neste serviço (CNH só dos motoristas) e modelo, cor e placa dos veículos. Sem telefone."
          path="credenciamento"
          target={{ jobId: j.id }}
          // Padrão: dia seguinte ao fim do serviço
          defaultExpiry={defaultDueDate(j, 1)}
        />
      )}

      <JobShifts
        job={j}
        costs={list}
        agents={agents}
        vehicles={vehicles}
        onShifts={(shifts) => set("shifts", shifts)}
        onCosts={setCosts}
        onAddPrice={(v) => set("price", j.price + v)}
      />

      <Section
        title="Custos do serviço"
        action={
          <span className="flex gap-1">
            <Button variant="ghost" className="!min-h-9 !px-3" onClick={() => setEditingCategories(!editingCategories)}>
              Editar categorias
            </Button>
            <Button variant="ghost" className="!min-h-9 !px-3" onClick={addCost}>
              <IconPlus className="size-4" /> Adicionar
            </Button>
          </span>
        }
      >
        {editingCategories && (
          <CostCategoriesEditor
            onClose={() => setEditingCategories(false)}
            onRenamed={(from, to) => setCosts((prev) => prev?.map((c) => (c.category === from ? { ...c, category: to } : c)) ?? null)}
          />
        )}
        {/* Uma linha por custo: descrição · categoria · valor · pago · remover; agente/parceiro numa segunda linha */}
        {list.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {list.map((c) => (
              <li key={c.id} className="space-y-1 py-1.5">
                <div className="flex flex-wrap items-center gap-1">
                  <input
                    className={`input ${cell} !min-h-9 min-w-[8rem] flex-1 basis-[calc(100%-2.75rem)] sm:basis-0`}
                    value={c.description}
                    onChange={(e) => updateCost(c.id, { description: e.target.value })}
                    placeholder="Descrição (ex.: diária do agente)"
                    aria-label="Descrição do custo"
                  />
                  <button
                    type="button"
                    onClick={() => setCosts(list.filter((x) => x.id !== c.id))}
                    aria-label="Remover custo"
                    className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-white/6 hover:text-danger sm:order-last"
                  >
                    <IconClose className="size-4" />
                  </button>
                  <Select
                    className={`${cell} !min-h-9 !w-auto`}
                    value={c.category}
                    onChange={(e) => updateCost(c.id, { category: e.target.value })}
                    aria-label="Categoria"
                  >
                    {/* fixos + os de Configurações + o atual, se saiu da lista */}
                    {[...new Set(["agent", "partner", ...costCategories, c.category])].map((k) => (
                      <option key={k} value={k}>
                        {costCategoryName(k)}
                      </option>
                    ))}
                  </Select>
                  <MoneyInput value={c.amount} onChange={(v) => updateCost(c.id, { amount: v })} label="Valor do custo" className={`${cellChild} !w-32 [&>input]:!min-h-9`} />
                  <Checkbox checked={c.paid} onChange={(v) => updateCost(c.id, { paid: v })} label="Pago" />
                </div>
                {/* Adiantamento ao fornecedor (ex.: sinal do aluguel do carro); o resto fica a pagar */}
                {!c.paid && c.amount > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-muted">
                    <span>Adiantado</span>
                    <MoneyInput value={c.advance} onChange={(v) => updateCost(c.id, { advance: Math.min(v, c.amount) })} label="Valor adiantado" className={`${cellChild} !w-32 [&>input]:!min-h-9`} />
                    <span className="num">falta pagar {brl.format(c.amount - Math.min(c.advance, c.amount))}</span>
                    <label className="ml-auto flex items-center gap-2">
                      Vence
                      <input className={`input ${cell} !min-h-9 !w-auto`} type="date" value={c.dueDate || dueDefault} onChange={(e) => updateCost(c.id, { dueDate: e.target.value })} />
                    </label>
                  </div>
                )}
                {c.category === "agent" && (
                  <Select className={`${cell} !min-h-9`} value={c.agentId ?? ""} onChange={(e) => pickCostAgent(c, e.target.value)} aria-label="Agente">
                    <option value="">Qual agente? (opcional)</option>
                    {/* Escalados no serviço primeiro */}
                    {[
                      { label: "Neste serviço", list: agents.filter((a) => j.agentIds.includes(a.id)) },
                      { label: "Outros", list: agents.filter((a) => !j.agentIds.includes(a.id)) },
                    ]
                      .filter((g) => g.list.length)
                      .map((g) => (
                        <optgroup key={g.label} label={g.label}>
                          {g.list.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </Select>
                )}
                {c.category === "partner" && (
                  <Select className={`${cell} !min-h-9`} value={c.partnerId ?? ""} onChange={(e) => updateCost(c.id, { partnerId: e.target.value || null })} aria-label="Parceiro">
                    <option value="">Qual parceiro? (opcional)</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Diárias, parceiros, combustível, pedágio… Tudo que sai do valor cobrado.</p>
        )}
      </Section>

      <dl className="grid grid-cols-2 border-y border-line text-center sm:grid-cols-4">
        {[
          ["Cobrado", brl.format(j.price), ""],
          ["Custos", brl.format(totalCosts), ""],
          [`Imposto (${percent.format(taxRate)})`, brl.format(tax), ""],
          ["Lucro", brl.format(profit), profit < 0 ? "text-danger" : "text-[#8fd6a5]"],
        ].map(([label, value, tone]) => (
          <div key={label} className="px-2 py-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className={`num mt-0.5 text-sm font-semibold ${tone}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <Field label="Observações">
        <TextArea rows={3} value={j.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
    </Sheet>
  );
}
