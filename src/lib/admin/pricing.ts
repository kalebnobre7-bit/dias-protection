import type { Pricing, PricingCost, PricingExtra, ProposalItem } from "./types";

// Calculadora de preço: mesmas linhas e fórmulas da planilha "Precificação" do Gabriel

export const PRICING_CATEGORIES = ["Equipe", "Transporte", "Amenidades", "Outros"];

const DEFAULTS = { margin: 0.25, taxes: 0.06, fees: 0 };

// Linha nova já com os percentuais gerais
export const pricingLine = (p: Pick<Pricing, "margin" | "taxes" | "fees">, category: string, description: string, qty: number, unitCost: number, extras: PricingExtra[] = []): PricingCost => ({
  id: crypto.randomUUID(),
  category,
  description,
  qty,
  unitCost,
  extras,
  margin: p.margin,
  taxes: p.taxes,
  fees: p.fees,
});

export const pricingExtra = (description: string, amount: number): PricingExtra => ({ id: crypto.randomUUID(), description, amount });

export function blankPricing(): Pricing {
  const row = (category: string, description: string, qty: number, unitCost: number, extras?: PricingExtra[]) => pricingLine(DEFAULTS, category, description, qty, unitCost, extras);
  return {
    costs: [
      row("Equipe", "Motorista", 1, 650),
      row("Transporte", "Veículo", 1, 1050, [pricingExtra("Combustível", 0), pricingExtra("Pedágios / estacionamento", 150)]),
      row("Amenidades", "Amenidades", 1, 0),
      row("Outros", "Despesas adicionais", 0, 0),
    ],
    ...DEFAULTS,
  };
}

// Propostas salvas antes dos percentuais por item herdam os percentuais gerais
type StoredCost = Omit<PricingCost, "extras" | "margin" | "taxes" | "fees"> & Partial<Pick<PricingCost, "extras" | "margin" | "taxes" | "fees">>;
export function normalizePricing(p: Omit<Pricing, "costs"> & { costs: StoredCost[] }): Pricing {
  return { ...p, costs: p.costs.map((c) => ({ ...c, extras: c.extras ?? [], margin: c.margin ?? p.margin, taxes: c.taxes ?? p.taxes, fees: c.fees ?? p.fees })) };
}

// Custo unitário com os subcustos
export const lineCost = (c: PricingCost) => c.unitCost + c.extras.reduce((s, e) => s + e.amount, 0);

// Margem é percentual sobre o PREÇO DE VENDA: preço = custo ÷ (1 − margem − impostos − taxas)
// Arredonda para baixo no real, como a planilha do Gabriel: 650 ÷ 0,51 = 1.274,51 → R$ 1.274,00
export function lineUnitPrice(c: PricingCost): number | null {
  const rate = c.margin + c.taxes + c.fees;
  return rate >= 1 ? null : Math.floor(lineCost(c) / (1 - rate) + 1e-6); // 1e-6: erro de ponto flutuante em divisões exatas
}

export type PricingResult = {
  cost: number;
  price: number | null; // null quando margem + impostos + taxas chegam a 100%
  taxes: number;
  fees: number;
  profit: number;
  effectiveMargin: number;
};

export function pricingResult(p: Pricing): PricingResult {
  const cost = p.costs.reduce((sum, c) => sum + c.qty * lineCost(c), 0);
  let price = 0;
  let taxes = 0;
  let fees = 0;
  for (const c of p.costs) {
    const unit = lineUnitPrice(c);
    if (unit === null) return { cost, price: null, taxes: 0, fees: 0, profit: 0, effectiveMargin: 0 };
    price += c.qty * unit;
    taxes += c.qty * unit * c.taxes;
    fees += c.qty * unit * c.fees;
  }
  const profit = price - cost - taxes - fees;
  return { cost, price, taxes, fees, profit, effectiveMargin: price ? profit / price : 0 };
}

// Mantém os itens da proposta iguais às linhas de preço (item.id === linha.id).
// Linha zerada ou excluída tira o item; itens criados à mão na proposta não mudam.
export function syncPricingItems(items: ProposalItem[], previous: Pricing | null, next: Pricing): ProposalItem[] {
  const known = new Set(previous?.costs.map((c) => c.id));
  const active = next.costs.flatMap((c) => {
    const unit = lineUnitPrice(c);
    return unit !== null && c.qty > 0 && lineCost(c) > 0 ? [{ c, unitPrice: unit }] : [];
  });
  const kept = items.flatMap((i) => {
    const line = active.find((a) => a.c.id === i.id);
    if (line) return [{ ...i, description: line.c.description, qty: line.c.qty, unitPrice: line.unitPrice }];
    return known.has(i.id) ? [] : [i];
  });
  const added = active
    .filter((a) => !items.some((i) => i.id === a.c.id))
    .map((a): ProposalItem => ({ id: a.c.id, description: a.c.description, detail: "", qty: a.c.qty, unit: "diária", unitPrice: a.unitPrice }));
  return [...kept, ...added];
}
