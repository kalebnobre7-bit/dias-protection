"use client";

import { useEffect, useState } from "react";
import { Plus as IconPlus, X as IconClose } from "lucide-react";

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
import { DateTile, MoneyInput, statusTone } from "@/components/admin/job-bits";
import { serviceTypeName, serviceTypeOptions } from "@/lib/admin/catalog";
import { brl, costCategoryLabel, formatDateTime, jobStatusLabel } from "@/lib/admin/labels";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { CostCategory, Job, JobCost, JobStatus } from "@/lib/admin/types";

type Filter = "all" | JobStatus;

const NEW_CLIENT = "__novo";

const blank = (): Job => ({
  id: newId(),
  clientId: null,
  serviceTypeId: serviceTypeOptions[0]?.value ?? null,
  startsAt: "",
  endsAt: "",
  origin: "",
  destination: "",
  status: "scheduled",
  price: 0,
  paymentStatus: "pending",
  paidAt: "",
  notes: "",
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

  // Atalho do Início: /admin/servicos?novo=1
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("novo")) setEditing(blank());
  }, []);

  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.name ?? "Sem cliente";
  const q = query.trim().toLowerCase();
  const filtered = rows
    .filter((j) => filter === "all" || j.status === filter)
    .filter((j) => !q || `${clientName(j.clientId)} ${serviceTypeName(j.serviceTypeId)} ${j.origin} ${j.destination}`.toLowerCase().includes(q))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

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
      {!loading && !rows.length ? (
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
            <List>
              {filtered.map((j) => (
                <Row
                  key={j.id}
                  onClick={() => setEditing(j)}
                  leading={<DateTile value={j.startsAt} />}
                  title={clientName(j.clientId)}
                  subtitle={[serviceTypeName(j.serviceTypeId), j.destination].filter(Boolean).join(" · ")}
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
          ) : (
            <p className="mt-6 text-center text-muted">Nenhum serviço neste filtro.</p>
          )}
        </>
      )}
      {editing && <JobSheet job={editing} isNew={!rows.some((r) => r.id === editing.id)} onClose={() => setEditing(null)} />}
    </>
  );
}

function JobSheet(props: { job: Job; isNew: boolean; onClose: () => void }) {
  const { value: j, set } = useForm(props.job);
  const { rows: clients } = useTable("clients");
  const { rows: agents } = useTable("agents");
  const { rows: vehicles } = useTable("vehicles");
  const { rows: partners } = useTable("partners");
  const { rows: allCosts, loading: costsLoading } = useTable("jobCosts");
  const [costs, setCosts] = useState<JobCost[] | null>(null);
  const [newClient, setNewClient] = useState("");
  const [clientChoice, setClientChoice] = useState(props.job.clientId ?? "");
  const [error, setError] = useState("");

  // Custos são editados localmente e gravados juntos no salvar
  useEffect(() => {
    if (costs === null && !costsLoading) setCosts(allCosts.filter((c) => c.jobId === props.job.id));
  }, [allCosts, costs, costsLoading, props.job.id]);
  const list = costs ?? [];
  const totalCosts = list.reduce((s, c) => s + (Number.isFinite(c.amount) ? c.amount : 0), 0);
  const profit = j.price - totalCosts;

  const updateCost = (id: string, patch: Partial<JobCost>) => setCosts(list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addCost = () =>
    setCosts([
      ...list,
      { id: newId(), jobId: j.id, description: "", category: "agent", amount: 0, agentId: null, partnerId: null, paid: false, createdAt: new Date().toISOString() },
    ]);

  const save = async () => {
    if (!j.startsAt) return setError("Informe a data e o horário de início.");
    if (clientChoice === NEW_CLIENT && !newClient.trim()) return setError("Informe o nome do novo cliente.");
    let clientId = clientChoice || null;
    if (clientChoice === NEW_CLIENT) {
      clientId = newId();
      await repo.upsert("clients", { id: clientId, name: newClient.trim(), company: "", phone: "", email: "", language: null, notes: "", createdAt: new Date().toISOString() });
    }
    await repo.upsert("jobs", { ...j, clientId, paidAt: j.paymentStatus === "paid" ? j.paidAt || j.startsAt.slice(0, 10) : "" });
    await repo.replaceJobCosts(
      j.id,
      list.filter((c) => c.description.trim() || c.amount > 0).map((c) => ({ ...c, description: c.description.trim() || costCategoryLabel[c.category] })),
    );
    props.onClose();
  };
  const remove = async () => {
    await repo.remove("jobs", j.id);
    props.onClose();
  };

  // Mostra os ativos + os já escalados (mesmo que tenham ficado inativos)
  const agentOptions = agents.filter((a) => a.active || j.agentIds.includes(a.id)).map((a) => ({ value: a.id, label: a.name }));
  const vehicleOptions = vehicles
    .filter((v) => v.active || j.vehicleIds.includes(v.id))
    .map((v) => ({ value: v.id, label: [v.model, v.plate].filter(Boolean).join(" · ") }));

  return (
    <Sheet
      open
      error={error}
      onClose={props.onClose}
      title={props.isNew ? "Novo serviço" : `${serviceTypeName(j.serviceTypeId)} · ${formatDateTime(j.startsAt)}`}
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

      <Field label="Cliente">
        <select className="input" value={clientChoice} onChange={(e) => setClientChoice(e.target.value)}>
          <option value="">Sem cliente</option>
          {[...clients]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          <option value={NEW_CLIENT}>+ Novo cliente…</option>
        </select>
      </Field>
      {clientChoice === NEW_CLIENT && (
        <Field label="Nome do novo cliente" hint="Os demais dados podem ser completados na aba Clientes.">
          <input className="input" value={newClient} onChange={(e) => setNewClient(e.target.value)} autoFocus />
        </Field>
      )}

      <Field label="Tipo de serviço">
        <select className="input" value={j.serviceTypeId ?? ""} onChange={(e) => set("serviceTypeId", e.target.value || null)}>
          {serviceTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Início">
          <input className="input" type="datetime-local" value={j.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
        </Field>
        <Field label="Término (opcional)">
          <input className="input" type="datetime-local" value={j.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
        </Field>
        <Field label="Origem">
          <input className="input" value={j.origin} onChange={(e) => set("origin", e.target.value)} />
        </Field>
        <Field label="Destino">
          <input className="input" value={j.destination} onChange={(e) => set("destination", e.target.value)} />
        </Field>
      </div>

      <Section title="Equipe e veículos">
        <div className="space-y-5 rounded-2xl border border-line p-4">
          <Field label="Agentes">
            <ChipSelect options={agentOptions} value={j.agentIds} onChange={(v) => set("agentIds", v)} empty="Cadastre agentes na aba Agentes." />
          </Field>
          <Field label="Veículos">
            <ChipSelect options={vehicleOptions} value={j.vehicleIds} onChange={(v) => set("vehicleIds", v)} empty="Cadastre veículos na aba Veículos." />
          </Field>
        </div>
      </Section>

      <Section title="Valor">
        <div className="space-y-4 rounded-2xl border border-line p-4">
          <Field label="Valor cobrado (R$)">
            <MoneyInput value={j.price} onChange={(v) => set("price", v)} />
          </Field>
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Pagamento">
              <Segmented
                value={j.paymentStatus}
                onChange={(v) => set("paymentStatus", v)}
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

      <Section
        title="Custos do serviço"
        action={
          <Button variant="ghost" className="!min-h-9 !px-3" onClick={addCost}>
            <IconPlus className="size-4" /> Adicionar
          </Button>
        }
      >
        {list.length ? (
          <ul className="space-y-3">
            {list.map((c) => (
              <li key={c.id} className="space-y-3 rounded-2xl border border-line p-4">
                <div className="flex gap-2">
                  <input
                    className="input"
                    value={c.description}
                    onChange={(e) => updateCost(c.id, { description: e.target.value })}
                    placeholder="Descrição (ex.: diária do agente)"
                    aria-label="Descrição do custo"
                  />
                  <button
                    type="button"
                    onClick={() => setCosts(list.filter((x) => x.id !== c.id))}
                    aria-label="Remover custo"
                    className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-white/6 hover:text-danger"
                  >
                    <IconClose className="size-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <select
                    className="input"
                    value={c.category}
                    onChange={(e) => updateCost(c.id, { category: e.target.value as CostCategory })}
                    aria-label="Categoria"
                  >
                    {(Object.keys(costCategoryLabel) as CostCategory[]).map((k) => (
                      <option key={k} value={k}>
                        {costCategoryLabel[k]}
                      </option>
                    ))}
                  </select>
                  <MoneyInput value={c.amount} onChange={(v) => updateCost(c.id, { amount: v })} label="Valor do custo" />
                  <label className="flex min-h-11 items-center gap-2 text-[0.9375rem]">
                    <input type="checkbox" className="size-4 accent-[#34c759]" checked={c.paid} onChange={(e) => updateCost(c.id, { paid: e.target.checked })} />
                    Pago
                  </label>
                </div>
                {c.category === "agent" && (
                  <select className="input" value={c.agentId ?? ""} onChange={(e) => updateCost(c.id, { agentId: e.target.value || null })} aria-label="Agente">
                    <option value="">Qual agente? (opcional)</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
                {c.category === "partner" && (
                  <select className="input" value={c.partnerId ?? ""} onChange={(e) => updateCost(c.id, { partnerId: e.target.value || null })} aria-label="Parceiro">
                    <option value="">Qual parceiro? (opcional)</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[0.9375rem] text-muted">Diárias, parceiros, combustível, pedágio… Tudo que sai do valor cobrado.</p>
        )}
      </Section>

      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line text-center">
        {[
          ["Cobrado", brl.format(j.price), ""],
          ["Custos", brl.format(totalCosts), ""],
          ["Lucro", brl.format(profit), profit < 0 ? "text-danger" : "text-[#8fd6a5]"],
        ].map(([label, value, tone]) => (
          <div key={label} className="bg-navy/60 px-2 py-4">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className={`num mt-1 font-semibold ${tone}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <Field label="Observações">
        <textarea className="input resize-none" rows={3} value={j.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
    </Sheet>
  );
}
