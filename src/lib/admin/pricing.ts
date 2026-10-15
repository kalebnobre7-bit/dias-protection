import type { Pricing } from "./types";

// Calculadora de preço: mesmas linhas e fórmulas da planilha "Precificação" do Gabriel

export const PRICING_CATEGORIES = ["Equipe", "Transporte", "Amenidades", "Outros"];

export function blankPricing(): Pricing {
  const row = (category: string, description: string, qty: number, unitCost: number) => ({
    id: crypto.randomUUID(),
    category,
    description,
    qty,
    unitCost,
  });
  return {
    costs: [
      row("Equipe", "Motorista", 1, 650),
      row("Transporte", "Veículo", 1, 1050),
      row("Transporte", "Combustível", 1, 0),
      row("Transporte", "Pedágios / estacionamento", 1, 150),
      row("Amenidades", "Amenidades", 1, 0),
      row("Outros", "Despesas adicionais", 0, 0),
    ],
    margin: 0.25,
    taxes: 0.06,
    fees: 0,
  };
}

export type PricingResult = {
  cost: number;
  price: number | null; // null quando margem + impostos + taxas chegam a 100%
  taxes: number;
  fees: number;
  profit: number;
  effectiveMargin: number;
};

// Margem é percentual sobre o PREÇO DE VENDA: preço = custo ÷ (1 − margem − impostos − taxas)
export function pricingResult(p: Pricing): PricingResult {
  const cost = p.costs.reduce((sum, c) => sum + c.qty * c.unitCost, 0);
  const rate = p.margin + p.taxes + p.fees;
  if (rate >= 1) return { cost, price: null, taxes: 0, fees: 0, profit: 0, effectiveMargin: 0 };
  const price = cost / (1 - rate);
  const taxes = price * p.taxes;
  const fees = price * p.fees;
  const profit = price - cost - taxes - fees;
  return { cost, price, taxes, fees, profit, effectiveMargin: price ? profit / price : 0 };
}
