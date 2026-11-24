import { brl } from "@/lib/admin/labels";
import type { MonthSummary } from "@/lib/admin/finance";

import { Stat, statStrip } from "./ui";

export type MonthDetail = "revenue" | "receivable" | "costs" | "profit";

export function MonthStats({ summary, onOpen }: { summary: MonthSummary; onOpen?: (detail: MonthDetail) => void }) {
  const open = (detail: MonthDetail) => (onOpen ? () => onOpen(detail) : undefined);
  return (
    <div className={statStrip[4]}>
      <Stat label="Receita bruta" value={brl.format(summary.revenue + summary.otherIncome)} tone="good" onClick={open("revenue")} />
      <Stat label="A receber" value={brl.format(summary.receivable)} tone={summary.receivable ? "muted" : "default"} onClick={open("receivable")} />
      <Stat label="Custos" value={brl.format(summary.jobCosts + summary.otherExpense)} onClick={open("costs")} />
      <Stat label="Lucro líquido" value={brl.format(summary.profit)} tone={summary.profit < 0 ? "bad" : "default"} onClick={open("profit")} />
    </div>
  );
}
