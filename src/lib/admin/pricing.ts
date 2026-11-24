import type { JobCost, Pricing, PricingCost, PricingExtra, ProposalItem } from "./types";

// Calculadora de preço: mesmas linhas e fórmulas da planilha "Precificação" do Gabriel

export const PRICING_CATEGORIES = ["Proteção", "Transporte", "Amenidades", "Outros"];

// Calculadora → proposta: a página de propostas lê esta chave do sessionStorage em ?nova=1
export const CALC_PRICING_KEY = "calc-pricing";

export const DEFAULTS = { margin: 0.25, taxes: 0.06, fees: 0 };

// Linha nova já com os percentuais gerais
export const pricingLine = (p: Pick<Pricing, "margin" | "taxes" | "fees">, category: string, description: string, qty: number, unitCost: number, extras: PricingExtra[] = [], units = 1): PricingCost => ({
  id: crypto.randomUUID(),
  category,
  description,
  units,
  qty,
  unitCost,
  extras,
  margin: p.margin,
  taxes: p.taxes,
  fees: p.fees,
});

export const pricingExtra = (description: string, amount: number): PricingExtra => ({ id: crypto.randomUUID(), description, amount });

// Escopo da proposta pré-preenche a planilha: veículos × diárias e agentes × diárias
export type PricingScope = { days: number; cars: number; guards: number };

// taxes: alíquota do Simples pela faixa de faturamento (monthTaxRate); sem ela, 6% da primeira faixa
export function blankPricing(taxes = DEFAULTS.taxes, scope: PricingScope = { days: 1, cars: 1, guards: 0 }): Pricing {
  const base = { ...DEFAULTS, taxes };
  const days = Math.max(1, scope.days);
  const cars = Math.max(1, scope.cars);
  const row = (category: string, description: string, qty: number, unitCost: number, extras?: PricingExtra[], units = 1) => pricingLine(base, category, description, qty, unitCost, extras, units);
  return {
    costs: [
      row("Transporte", "Motorista", days, 650, [], cars),
      row("Transporte", "Veículo", days, 1050, [pricingExtra("Combustível", 0), pricingExtra("Pedágios / estacionamento", 150)], cars),
      ...(scope.guards > 0 ? [row("Proteção", "Agente de proteção", days, 0, [], scope.guards)] : []),
      row("Amenidades", "Amenidades", 1, 0),
      row("Outros", "Despesas adicionais", 0, 0),
    ],
    ...base,
  };
}

// Propostas salvas antes dos percentuais por item herdam os percentuais gerais
// Antes do fator multiplicador a linha tinha só a quantidade (units = 1)
type StoredCost = Omit<PricingCost, "extras" | "margin" | "taxes" | "fees" | "units"> & Partial<Pick<PricingCost, "extras" | "margin" | "taxes" | "fees" | "units">>;
export function normalizePricing(p: Omit<Pricing, "costs"> & { costs: StoredCost[] }): Pricing {
  return { ...p, costs: p.costs.map((c) => ({ ...c, units: c.units ?? 1, extras: c.extras ?? [], margin: c.margin ?? p.margin, taxes: c.taxes ?? p.taxes, fees: c.fees ?? p.fees })) };
}

// Quantidade total da linha: fator × diárias (2 motoristas × 4 diárias = 8)
export const lineQty = (c: PricingCost) => c.units * c.qty;

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
  const cost = p.costs.reduce((sum, c) => sum + lineQty(c) * lineCost(c), 0);
  let price = 0;
  let taxes = 0;
  let fees = 0;
  for (const c of p.costs) {
    const unit = lineUnitPrice(c);
    if (unit === null) return { cost, price: null, taxes: 0, fees: 0, profit: 0, effectiveMargin: 0 };
    price += lineQty(c) * unit;
    taxes += lineQty(c) * unit * c.taxes;
    fees += lineQty(c) * unit * c.fees;
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
    return unit !== null && lineQty(c) > 0 && lineCost(c) > 0 ? [{ c, unitPrice: unit }] : [];
  });
  const kept = items.flatMap((i) => {
    const line = active.find((a) => a.c.id === i.id);
    if (line) return [{ ...i, description: line.c.description, qty: lineQty(line.c), unitPrice: line.unitPrice }];
    return known.has(i.id) ? [] : [i];
  });
  const added = active
    .filter((a) => !items.some((i) => i.id === a.c.id))
    .map((a): ProposalItem => ({ id: a.c.id, description: a.c.description, detail: "", qty: lineQty(a.c), unit: "diária", unitPrice: a.unitPrice }));
  return [...kept, ...added];
}

// Proposta aceita: cada linha da planilha vira um custo previsto do serviço (a pagar)
export function pricingJobCosts(p: Pricing, jobId: string): JobCost[] {
  const createdAt = new Date().toISOString();
  return p.costs
    .filter((c) => lineQty(c) * lineCost(c) > 0)
    .map((c) => ({
      id: crypto.randomUUID(),
      jobId,
      description: c.units > 1 ? `${c.description} (${c.units}× ${c.qty})` : c.description,
      category: c.category,
      amount: lineQty(c) * lineCost(c),
      agentId: null,
      partnerId: null,
      paid: false,
      advance: 0,
      createdAt,
    }));
}
