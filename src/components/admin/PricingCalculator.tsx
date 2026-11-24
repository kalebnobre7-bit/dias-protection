"use client";

import { useState } from "react";
import { ChevronDown as IconChevron, Plus as IconPlus, X as IconClose } from "lucide-react";

import { MoneyInput } from "@/components/admin/job-bits";
import { cell, cellChild, Field, NumberInput, Section, Select } from "@/components/admin/ui";
import { brl } from "@/lib/admin/labels";
import { lineCost, lineQty, lineUnitPrice, PRICING_CATEGORIES, pricingExtra, pricingLine, pricingResult } from "@/lib/admin/pricing";
import type { Pricing, PricingCost, PricingExtra } from "@/lib/admin/types";

const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

// Planilha de precificação no painel: custos × fator × diárias, margem, impostos e taxas → preço final
export function PricingCalculator({ value: p, onChange, taxNote }: { value: Pricing; onChange: (p: Pricing) => void; taxNote?: string }) {
  const r = pricingResult(p);
  const set = <K extends keyof Pricing>(key: K, v: Pricing[K]) => onChange({ ...p, [key]: v });
  const updateCost = (id: string, patch: Partial<PricingCost>) =>
    set("costs", p.costs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addCost = () => set("costs", [...p.costs, pricingLine(p, "Outros", "", 1, 0)]);
  // Linhas com subcustos e percentuais à mostra
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (id: string) => setOpen(open.includes(id) ? open.filter((x) => x !== id) : [...open, id]);
  // Percentual geral: vale para todas as linhas de uma vez
  const applyAll = (key: "margin" | "taxes" | "fees", v: number) => onChange({ ...p, [key]: v, costs: p.costs.map((c) => ({ ...c, [key]: v })) });

  return (
    <div className="space-y-6">
      <Section
        title="Custos"
        action={
          <button type="button" onClick={addCost} className="flex items-center gap-1 text-sm font-medium text-accent">
            <IconPlus className="size-4" /> Custo
          </button>
        }
      >
        {/* Uma linha por custo: descrição · categoria · fator × diárias × unitário = total · remover. No celular a descrição fica em cima */}
        <ul className="divide-y divide-line border-y border-line">
          {p.costs.map((c) => {
            const unitPrice = lineUnitPrice(c);
            const updateExtra = (id: string, patch: Partial<PricingExtra>) => updateCost(c.id, { extras: c.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
            return (
            <li key={c.id} className="space-y-2 py-1.5">
              <div className="flex flex-wrap items-center gap-1">
              <input
                className={`input ${cell} !min-h-9 min-w-[8rem] flex-1 basis-[calc(100%-2.75rem)] sm:basis-0`}
                value={c.description}
                onChange={(e) => updateCost(c.id, { description: e.target.value })}
                placeholder="Descrição"
                aria-label="Descrição do custo"
              />
              <button
                type="button"
                onClick={() => set("costs", p.costs.filter((x) => x.id !== c.id))}
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
                {[...new Set([...PRICING_CATEGORIES, c.category])].map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </Select>
              {/* Fator: quantos motoristas, veículos ou agentes; diárias de cada um */}
              <NumberInput value={c.units} onChange={(v) => updateCost(c.id, { units: v ?? 1 })} fallback={1} min={1} digits={2} suffix="×" label="Fator (pessoas ou veículos)" className={`${cellChild} [&>input]:!min-h-9`} />
              <NumberInput value={c.qty} onChange={(v) => updateCost(c.id, { qty: v ?? 0 })} fallback={0} digits={3} suffix="d ×" label="Diárias" className={`${cellChild} [&>input]:!min-h-9`} />
              <MoneyInput value={c.unitCost} onChange={(v) => updateCost(c.id, { unitCost: v })} label="Custo unitário" className={`${cellChild} !w-32 [&>input]:!min-h-9`} />
              <span className="num ml-auto w-24 shrink-0 text-right text-sm font-medium">{brl.format(lineQty(c) * lineCost(c))}</span>
              </div>
              <button type="button" onClick={() => toggle(c.id)} aria-expanded={open.includes(c.id)} className="flex items-center gap-1 text-[0.8125rem] text-muted hover:text-text">
                <IconChevron className={`size-3.5 transition-transform duration-200 ${open.includes(c.id) ? "rotate-180" : ""}`} />
                Subcustos e percentuais · venda <span className="num">{unitPrice === null ? "rever percentuais" : `${brl.format(unitPrice)} / un.`}</span>
              </button>
              {open.includes(c.id) && (
                <div className="space-y-3 border-l-2 border-line-strong pl-3">
                  {c.extras.map((e) => (
                    <div key={e.id} className="flex items-center gap-1">
                      <input
                        className={`input ${cell} !min-h-9 min-w-0 flex-1`}
                        value={e.description}
                        onChange={(ev) => updateExtra(e.id, { description: ev.target.value })}
                        placeholder="Subcusto (ex.: combustível)"
                        aria-label="Descrição do subcusto"
                      />
                      <MoneyInput value={e.amount} onChange={(v) => updateExtra(e.id, { amount: v })} label="Valor do subcusto" className={`${cellChild} !w-32 [&>input]:!min-h-9`} />
                      <button
                        type="button"
                        onClick={() => updateCost(c.id, { extras: c.extras.filter((x) => x.id !== e.id) })}
                        aria-label="Remover subcusto"
                        className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-white/6 hover:text-danger"
                      >
                        <IconClose className="size-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => updateCost(c.id, { extras: [...c.extras, pricingExtra("", 0)] })} className="flex items-center gap-1 text-sm font-medium text-accent">
                    <IconPlus className="size-4" /> Subcusto
                  </button>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <PercentInput label="Margem" value={c.margin} onChange={(v) => updateCost(c.id, { margin: v })} />
                    <PercentInput label="Impostos" value={c.taxes} onChange={(v) => updateCost(c.id, { taxes: v })} />
                    <PercentInput label="Outras taxas" value={c.fees} onChange={(v) => updateCost(c.id, { fees: v })} />
                  </div>
                  <p className="text-sm">
                    Preço de venda: <span className="num font-semibold">{unitPrice === null ? "rever percentuais" : `${brl.format(unitPrice)} / unidade`}</span>
                  </p>
                </div>
              )}
            </li>
            );
          })}
        </ul>
        <p className="mt-3 flex justify-between px-1 text-sm font-semibold">
          <span>Custo total</span>
          <span className="num">{brl.format(r.cost)}</span>
        </p>
      </Section>

      <Section title="Percentuais sobre o preço de venda">
        <div className="grid gap-4 sm:grid-cols-3">
          <PercentInput label="Margem de lucro" value={p.margin} onChange={(v) => applyAll("margin", v)} />
          <PercentInput label="Impostos" value={p.taxes} onChange={(v) => applyAll("taxes", v)} />
          <PercentInput label="Outras taxas" value={p.fees} onChange={(v) => applyAll("fees", v)} />
        </div>
        <p className="mt-2 px-1 text-xs text-muted">Alterar aqui aplica em todos os itens. Para um percentual diferente, abra o item.</p>
        {taxNote && <p className="mt-1 px-1 text-xs text-muted">{taxNote}</p>}
      </Section>

      <dl className="space-y-2 border-t border-line px-1 pt-3 text-sm">
        <div className="flex items-baseline justify-between gap-4 text-base font-semibold">
          <dt>Preço final a cobrar</dt>
          <dd className="num">{r.price === null ? "Rever percentuais" : brl.format(r.price)}</dd>
        </div>
        {r.price === null ? (
          <p className="text-sm text-danger">Margem, impostos e taxas somados precisam ficar abaixo de 100%.</p>
        ) : (
          <>
            <ResultRow label="Impostos estimados" value={brl.format(r.taxes)} />
            <ResultRow label="Outras taxas estimadas" value={brl.format(r.fees)} />
            <ResultRow label="Lucro estimado" value={brl.format(r.profit)} />
            <ResultRow label="Margem efetiva" value={pct.format(r.effectiveMargin)} />
          </>
        )}
      </dl>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-line pt-2 text-muted">
      <dt>{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}

// Digita em % e guarda em fração (25 → 0.25)
function PercentInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <NumberInput value={Math.round(value * 1000) / 10} onChange={(v) => onChange((v ?? 0) / 100)} fallback={0} max={100} decimal digits={4} suffix="%" label={label} />
    </Field>
  );
}
