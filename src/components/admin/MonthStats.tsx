import { brl } from "@/lib/admin/labels";
import type { MonthSummary } from "@/lib/admin/finance";

import { Stat } from "./ui";

export function MonthStats({ summary }: { summary: MonthSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Receita" value={brl.format(summary.revenue + summary.otherIncome)} />
      <Stat label="A receber" value={brl.format(summary.receivable)} tone={summary.receivable ? "muted" : "default"} />
      <Stat label="Custos" value={brl.format(summary.jobCosts + summary.otherExpense)} />
      <Stat label="Lucro" value={brl.format(summary.profit)} tone={summary.profit < 0 ? "bad" : "good"} />
    </div>
  );
}
