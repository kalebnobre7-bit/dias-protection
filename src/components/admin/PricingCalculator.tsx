"use client";

import { Plus as IconPlus, X as IconClose } from "lucide-react";

import { MoneyInput } from "@/components/admin/job-bits";
import { Field, Section } from "@/components/admin/ui";
import { brl } from "@/lib/admin/labels";
import { PRICING_CATEGORIES, pricingResult } from "@/lib/admin/pricing";
import type { Pricing, PricingCost } from "@/lib/admin/types";

const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

// Planilha de precificação no painel: custos × quantidade, margem, impostos e taxas → preço final
export function PricingCalculator({ value: p, onChange }: { value: Pricing; onChange: (p: Pricing) => void }) {
  const r = pricingResult(p);
  const set = <K extends keyof Pricing>(key: K, v: Pricing[K]) => onChange({ ...p, [key]: v });
  const updateCost = (id: string, patch: Partial<PricingCost>) =>
    set("costs", p.costs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addCost = () =>
    set("costs", [...p.costs, { id: crypto.randomUUID(), category: "Outros", description: "", qty: 1, unitCost: 0 }]);

  return (
    <div className="space-y-8">
      <Section
        title="Custos"
        action={
          <button type="button" onClick={addCost} className="flex items-center gap-1 text-[0.875rem] font-medium text-accent">
            <IconPlus className="size-4" /> Custo
          </button>
        }
      >
        <ul className="space-y-3">
          {p.costs.map((c) => (
            <li key={c.id} className="space-y-3 rounded-2xl border border-line p-4">
              <div className="flex gap-2">
                <select
                  className="input !w-36 shrink-0"
                  value={c.category}
                  onChange={(e) => updateCost(c.id, { category: e.target.value })}
                  aria-label="Categoria"
                >
                  {[...new Set([...PRICING_CATEGORIES, c.category])].map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  className="input"
                  value={c.description}
                  onChange={(e) => updateCost(c.id, { description: e.target.value })}
                  placeholder="Descrição"
                  aria-label="Descrição do custo"
                />
                <button
                  type="button"
                  onClick={() => set("costs", p.costs.filter((x) => x.id !== c.id))}
                  aria-label="Remover custo"
                  className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-white/6 hover:text-danger"
                >
                  <IconClose className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2">
                <input
                  className="input num"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={c.qty}
                  onChange={(e) => updateCost(c.id, { qty: Math.max(0, Number(e.target.value) || 0) })}
                  aria-label="Quantidade"
                />
                <MoneyInput value={c.unitCost} onChange={(v) => updateCost(c.id, { unitCost: v })} label="Custo unitário" />
                <span className="num min-w-24 text-right text-[0.9375rem] font-medium">{brl.format(c.qty * c.unitCost)}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between px-1 text-[0.9375rem] font-semibold">
          <span>Custo total</span>
          <span className="num">{brl.format(r.cost)}</span>
        </p>
      </Section>

      <Section title="Percentuais sobre o preço de venda">
        <div className="grid grid-cols-3 gap-3">
          <PercentInput label="Margem de lucro" value={p.margin} onChange={(v) => set("margin", v)} />
          <PercentInput label="Impostos" value={p.taxes} onChange={(v) => set("taxes", v)} />
          <PercentInput label="Outras taxas" value={p.fees} onChange={(v) => set("fees", v)} />
        </div>
      </Section>

      <dl className="space-y-2 rounded-2xl bg-navy/60 p-4 text-[0.9375rem]">
        <div className="flex items-baseline justify-between gap-4 text-lg font-semibold">
          <dt>Preço final a cobrar</dt>
          <dd className="num">{r.price === null ? "Rever percentuais" : brl.format(r.price)}</dd>
        </div>
        {r.price === null ? (
          <p className="text-[0.875rem] text-danger">Margem, impostos e taxas somados precisam ficar abaixo de 100%.</p>
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
      <span className="relative block">
        <input
          className="input num !pr-9"
          type="number"
          min={0}
          max={100}
          step={0.5}
          inputMode="decimal"
          value={Math.round(value * 1000) / 10}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0) / 100)}
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">%</span>
      </span>
    </Field>
  );
}
