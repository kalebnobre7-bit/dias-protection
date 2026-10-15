"use client";

import { useState } from "react";

import { PricingCalculator } from "@/components/admin/PricingCalculator";
import { Button, PageHeader } from "@/components/admin/ui";
import { blankPricing } from "@/lib/admin/pricing";

// Simulação solta, nada é salvo. Para ligar o preço a uma proposta, use a aba "Preço" dela.
export default function CalculatorPage() {
  const [pricing, setPricing] = useState(blankPricing);
  const [round, setRound] = useState(0); // remonta os campos de valor ao recomeçar

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Calculadora"
        subtitle="Simulação pela planilha de precificação. Nada é salvo; na proposta, use a aba Preço."
        action={
          <Button
            variant="secondary"
            onClick={() => {
              setPricing(blankPricing());
              setRound((n) => n + 1);
            }}
          >
            Recomeçar
          </Button>
        }
      />
      <PricingCalculator key={round} value={pricing} onChange={setPricing} />
    </div>
  );
}
