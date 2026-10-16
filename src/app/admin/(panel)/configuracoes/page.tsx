"use client";

import { Plus as IconPlus, X as IconClose } from "lucide-react";
import { useState } from "react";

import { MoneyInput } from "@/components/admin/job-bits";
import { Button, Field, NumberInput, PageHeader, Section, Skeleton, TextArea } from "@/components/admin/ui";
import { onlyDigits } from "@/lib/admin/proposals";
import { DEFAULT_SETTINGS, useSettings } from "@/lib/admin/settings";
import { repo, useSaving } from "@/lib/admin/store";
import type { ItemPreset, Settings } from "@/lib/admin/types";

// Dados que antes ficavam no código: contato da empresa nos documentos e padrões de cada proposta nova
export default function SettingsPage() {
  const { settings, loading } = useSettings();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Configurações" subtitle="Dados da empresa nos documentos e padrões das propostas novas." />
      {loading ? <Skeleton rows={6} /> : <SettingsForm initial={settings} />}
    </div>
  );
}

const unitsText = (units: string[]) => units.join(", ");
const parseUnits = (text: string) => [...new Set(text.split(",").map((u) => u.trim()).filter(Boolean))];

function SettingsForm({ initial }: { initial: Settings }) {
  const [base, setBase] = useState({ settings: initial, units: unitsText(initial.proposal.units) });
  const [s, setS] = useState(initial);
  const [units, setUnits] = useState(base.units);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const saving = useSaving();
  const dirty = JSON.stringify(s) !== JSON.stringify(base.settings) || units !== base.units;

  const setCompany = <K extends keyof Settings["company"]>(k: K, v: Settings["company"][K]) => {
    setS((prev) => ({ ...prev, company: { ...prev.company, [k]: v } }));
    setSaved(false);
  };
  const setProposal = <K extends keyof Settings["proposal"]>(k: K, v: Settings["proposal"][K]) => {
    setS((prev) => ({ ...prev, proposal: { ...prev.proposal, [k]: v } }));
    setSaved(false);
  };
  const unitList = parseUnits(units);
  const updatePreset = (n: number, patch: Partial<ItemPreset>) =>
    setProposal("presets", s.proposal.presets.map((x, i) => (i === n ? { ...x, ...patch } : x)));

  const save = async () => {
    const next: Settings = {
      ...s,
      company: { ...s.company, whatsapp: onlyDigits(s.company.whatsapp), instagram: s.company.instagram.trim().replace(/^@/, "") },
      proposal: { ...s.proposal, units: unitList, presets: s.proposal.presets.filter((x) => x.description.trim()) },
      createdAt: s.createdAt || new Date().toISOString(),
    };
    try {
      setError("");
      await repo.upsert("settings", next);
      setS(next);
      setUnits(unitsText(next.proposal.units));
      setBase({ settings: next, units: unitsText(next.proposal.units) });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };

  return (
    <div className="space-y-10 pb-4">
      <Section title="Empresa nos documentos">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Responsável" hint="Assina a proposta.">
              <input className="input" value={s.company.founderName} onChange={(e) => setCompany("founderName", e.target.value)} />
            </Field>
            <Field label="Cargo">
              <input className="input" value={s.company.founderRole} onChange={(e) => setCompany("founderRole", e.target.value)} />
            </Field>
          </div>
          <Field label="Razão social">
            <input className="input" value={s.company.legalName} onChange={(e) => setCompany("legalName", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp" hint="Com DDI e DDD. Ex.: 55 11 97071-7926">
              <input className="input num" type="tel" inputMode="tel" value={s.company.whatsapp} onChange={(e) => setCompany("whatsapp", e.target.value)} />
            </Field>
            <Field label="E-mail">
              <input className="input" type="email" value={s.company.email} onChange={(e) => setCompany("email", e.target.value)} />
            </Field>
            <Field label="Instagram" hint="Sem o @.">
              <input className="input" value={s.company.instagram} onChange={(e) => setCompany("instagram", e.target.value)} />
            </Field>
            <Field label="Cidade">
              <input className="input" value={s.company.city} onChange={(e) => setCompany("city", e.target.value)} />
            </Field>
          </div>
          <p className="px-1 text-xs text-muted">Vale para a proposta em A4 e o resumo do WhatsApp. O site público continua com os dados dele.</p>
        </div>
      </Section>

      <Section title="Padrões da proposta nova">
        <div className="space-y-4">
          <Field label="Validade" hint="Conta a partir da data de emissão.">
            <NumberInput value={s.proposal.validityDays} onChange={(v) => setProposal("validityDays", v ?? 10)} fallback={10} min={1} max={365} digits={3} suffix="dias" label="Validade" />
          </Field>
          <Field label="Pagamento">
            <TextArea rows={3} value={s.proposal.paymentTerms} onChange={(e) => setProposal("paymentTerms", e.target.value)} />
          </Field>
          <Field label="Condições gerais" hint="Uma por linha.">
            <TextArea rows={6} value={s.proposal.terms} onChange={(e) => setProposal("terms", e.target.value)} />
          </Field>
          <Field label="Unidades" hint="Separadas por vírgula. Aparecem na lista de cada item.">
            <input
              className="input"
              value={units}
              onChange={(e) => {
                setUnits(e.target.value);
                setSaved(false);
              }}
            />
          </Field>
          <p className="px-1 text-xs text-muted">Propostas já criadas não mudam; o padrão vale para as próximas.</p>
        </div>
      </Section>

      <Section
        title="Catálogo de itens"
        action={
          <Button
            variant="secondary"
            className="!min-h-9 !px-3"
            onClick={() => setProposal("presets", [...s.proposal.presets, { description: "", detail: "", unit: unitList[0] ?? "un.", unitPrice: 0 }])}
          >
            <IconPlus className="size-4" /> Item
          </Button>
        }
      >
        <p className="mb-3 px-1 text-[0.875rem] text-muted">Aparecem em “+ Adicionar item…” na proposta. Valor zerado = definir na hora.</p>
        <ul className="space-y-3">
          {s.proposal.presets.map((x, n) => (
            <li key={n} className="space-y-3 rounded-2xl border border-line p-4">
              <div className="flex gap-2">
                <input className="input" value={x.description} onChange={(e) => updatePreset(n, { description: e.target.value })} placeholder="Descrição" aria-label="Descrição do item" />
                <button
                  type="button"
                  onClick={() => setProposal("presets", s.proposal.presets.filter((_, i) => i !== n))}
                  aria-label="Remover item do catálogo"
                  className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-white/6 hover:text-danger"
                >
                  <IconClose className="size-4" />
                </button>
              </div>
              <input className="input !min-h-10 !text-[0.875rem]" value={x.detail} onChange={(e) => updatePreset(n, { detail: e.target.value })} placeholder="Detalhe (ex.: Diária de até 12h)" aria-label="Detalhe do item" />
              <div className="flex flex-wrap items-center gap-2">
                <select className="input !w-auto" value={x.unit} onChange={(e) => updatePreset(n, { unit: e.target.value })} aria-label="Unidade">
                  {[...new Set([...unitList, x.unit])].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <MoneyInput value={x.unitPrice} onChange={(v) => updatePreset(n, { unitPrice: v })} label="Valor padrão" className="min-w-[8.5rem] flex-1" />
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setProposal("presets", DEFAULT_SETTINGS.proposal.presets)}
          className="mt-3 px-1 text-[0.875rem] text-muted underline-offset-4 hover:text-silver hover:underline"
        >
          Restaurar catálogo padrão
        </button>
      </Section>

      {/* Barra de salvar sempre à mão, mesmo no fim da página */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-line bg-ink-2/95 p-3 backdrop-blur">
        {error ? (
          <span className="mr-auto text-[0.875rem] text-danger">{error}</span>
        ) : (
          <span className="mr-auto text-[0.875rem] text-muted">{saved ? "Salvo." : dirty ? "Alterações não salvas." : "Tudo salvo."}</span>
        )}
        <Button disabled={!dirty || saving} onClick={save}>
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
