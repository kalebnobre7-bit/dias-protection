"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PricingCalculator } from "@/components/admin/PricingCalculator";
import { Button, Field, PageHeader, Select } from "@/components/admin/ui";
import { currentMonth, taxSuggestion } from "@/lib/admin/finance";
import { brl, proposalStatusLabel } from "@/lib/admin/labels";
import { blankPricing, CALC_PRICING_KEY, pricingResult } from "@/lib/admin/pricing";
import { useTable } from "@/lib/admin/store";

// Simulação solta: nada é salvo até virar proposta
export default function CalculatorPage() {
  const router = useRouter();
  const { rows: jobs, loading } = useTable("jobs");
  const tax = taxSuggestion(currentMonth(), jobs);
  const [pricing, setPricing] = useState(blankPricing);
  const [round, setRound] = useState(0); // remonta os campos de valor ao recomeçar
  const [templateId, setTemplateId] = useState("");
  const { rows: proposals } = useTable("proposals");
  const { rows: clients } = useTable("clients");
  // Orçamentos já feitos (aceitos, recusados ou não) servem de modelo
  const templates = proposals.filter((p) => p.pricing?.costs.length).sort((a, b) => b.number.localeCompare(a.number));
  const restart = () => {
    setPricing(blankPricing(tax.rate));
    setTemplateId("");
    setRound((n) => n + 1);
  };
  const applyTemplate = (id: string) => {
    const source = templates.find((p) => p.id === id)?.pricing;
    setTemplateId(id);
    if (!source) return restart();
    // Ids novos: a proposta criada daqui não pode reaproveitar as linhas da original
    setPricing({ ...source, costs: source.costs.map((c) => ({ ...c, id: crypto.randomUUID(), extras: c.extras.map((e) => ({ ...e, id: crypto.randomUUID() })) })) });
    setRound((n) => n + 1);
  };

  // Imposto pela faixa de faturamento assim que os serviços carregam
  useEffect(() => {
    if (!loading) restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const toProposal = () => {
    sessionStorage.setItem(CALC_PRICING_KEY, JSON.stringify(pricing));
    router.push("/admin/propostas?nova=1");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Calculadora"
        subtitle="Simulação pela planilha de precificação. Gostou do preço? Crie a proposta com ele."
        action={
          <Button variant="secondary" onClick={restart}>
            Recomeçar
          </Button>
        }
      />
      {templates.length > 0 && (
        <div className="mb-6">
          <Field label="Partir de um orçamento anterior" hint="Copia a planilha de preço. O orçamento original não muda.">
            <Select value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">Planilha em branco</option>
              {templates.map((p) => {
                const price = p.pricing ? pricingResult(p.pricing).price : null;
                return (
                  <option key={p.id} value={p.id}>
                    {[p.number, clients.find((c) => c.id === p.clientId)?.name, p.title, proposalStatusLabel[p.status], price === null ? null : brl.format(price)].filter(Boolean).join(" · ")}
                  </option>
                );
              })}
            </Select>
          </Field>
        </div>
      )}
      <PricingCalculator key={round} value={pricing} onChange={setPricing} taxNote={loading ? undefined : tax.note} />
      <div className="mt-6 flex justify-end">
        <Button disabled={pricingResult(pricing).price === null} onClick={toProposal}>
          Criar proposta com este preço
        </Button>
      </div>
    </div>
  );
}
