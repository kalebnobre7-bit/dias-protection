"use client";

import { Plus as IconPlus, X as IconClose } from "lucide-react";

import { MoneyInput } from "@/components/admin/job-bits";
import { Field, NumberInput, Section } from "@/components/admin/ui";
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
    <div className="space-y-6">
      <Section
        title="Custos"
        action={
          <button type="button" onClick={addCost} className="flex items-center gap-1 text-sm font-medium text-accent">
            <IconPlus className="size-4" /> Custo
          </button>
        }
      >
        {/* Uma linha por custo: descrição · categoria · qtd × unitário = total · remover. No celular a descrição fica em cima */}
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {p.costs.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
              <input
                className="input !min-h-9 min-w-[8rem] flex-1 basis-[calc(100%-2.75rem)] sm:basis-0"
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
              <select
                className="input !min-h-9 !w-auto"
                value={c.category}
                onChange={(e) => updateCost(c.id, { category: e.target.value })}
                aria-label="Categoria"
              >
                {[...new Set([...PRICING_CATEGORIES, c.category])].map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
              <NumberInput value={c.qty} onChange={(v) => updateCost(c.id, { qty: v ?? 0 })} fallback={0} digits={3} suffix="×" label="Quantidade" className="[&>input]:!min-h-9" />
              <MoneyInput value={c.unitCost} onChange={(v) => updateCost(c.id, { unitCost: v })} label="Custo unitário" className="!w-32 [&>input]:!min-h-9" />
              <span className="num ml-auto w-24 shrink-0 text-right text-sm font-medium">{brl.format(c.qty * c.unitCost)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between px-1 text-sm font-semibold">
          <span>Custo total</span>
          <span className="num">{brl.format(r.cost)}</span>
        </p>
      </Section>

      <Section title="Percentuais sobre o preço de venda">
        <div className="grid gap-4 sm:grid-cols-3">
          <PercentInput label="Margem de lucro" value={p.margin} onChange={(v) => set("margin", v)} />
          <PercentInput label="Impostos" value={p.taxes} onChange={(v) => set("taxes", v)} />
          <PercentInput label="Outras taxas" value={p.fees} onChange={(v) => set("fees", v)} />
        </div>
      </Section>

      <dl className="space-y-2 rounded-xl bg-navy/60 p-4 text-sm">
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
