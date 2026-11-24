"use client";

import { useState } from "react";

import { MoneyInput } from "@/components/admin/job-bits";
import { Button, Checkbox, Section, cell } from "@/components/admin/ui";
import { brl, formatDateTime } from "@/lib/admin/labels";
import { applyOvertime, defaultDueDate, jobDates, overtimeCharge, overtimeRows, shiftHours } from "@/lib/admin/overtime";
import { useSettings } from "@/lib/admin/settings";
import type { AgentRecord, Job, JobCost, JobShift, ShiftGroup, Vehicle } from "@/lib/admin/types";

const GROUPS: { value: ShiftGroup; label: string }[] = [
  { value: "agent", label: "Agentes" },
  { value: "driver", label: "Motoristas" },
  { value: "vehicle", label: "Veículos" },
];

const hoursText = (h: number) => `${h.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`;

// Horários reais de cada dia e as horas extras que viram linhas de custo
export function JobShifts(props: {
  job: Job;
  costs: JobCost[];
  agents: AgentRecord[];
  vehicles: Vehicle[];
  onShifts: (shifts: JobShift[]) => void;
  onCosts: (costs: JobCost[]) => void;
  onAddPrice: (value: number) => void;
}) {
  const { costs: cfg } = useSettings().settings;
  const dailyHours = cfg.dailyHours || 10;
  const [rates, setRates] = useState<Record<string, number>>({});
  const [charge, setCharge] = useState<number | null>(null);
  const j = props.job;
  const dates = jobDates(j);
  const split = j.shifts.some((s) => s.group !== "all");
  const groups = split ? GROUPS : [{ value: "all" as ShiftGroup, label: "" }];
  const rows = overtimeRows(j, props.costs, props.agents, props.vehicles, dailyHours).map((r) => ({ ...r, rate: rates[r.key] ?? r.rate }));
  const hasOvertimeLines = props.costs.some((c) => c.overtimeHours > 0);

  const setShift = (date: string, group: ShiftGroup, patch: Partial<Pick<JobShift, "start" | "end">>) => {
    const current = j.shifts.find((s) => s.date === date && s.group === group) ?? { date, group, start: "", end: "" };
    props.onShifts([...j.shifts.filter((s) => !(s.date === date && s.group === group)), { ...current, ...patch }]);
  };
  // Separar copia o horário geral para cada grupo; juntar fica com o dos agentes
  const toggleSplit = (on: boolean) =>
    props.onShifts(
      on
        ? j.shifts.filter((s) => s.group === "all").flatMap((s) => GROUPS.map((g) => ({ ...s, group: g.value })))
        : j.shifts.filter((s) => s.group === "agent").map((s) => ({ ...s, group: "all" as ShiftGroup })),
    );

  const calculate = () => {
    const next = applyOvertime(props.costs, rows, j.id, defaultDueDate(j, cfg.paymentDays ?? 15));
    props.onCosts(next);
    const overtimeCost = next.filter((c) => c.overtimeHours > 0).reduce((s, c) => s + c.amount, 0);
    setCharge(overtimeCost > 0 ? overtimeCharge(j.price, next, overtimeCost) : null);
  };

  if (!dates.length) return null;

  return (
    <Section title="Horários operacionais">
      <div className="space-y-4">
        <Checkbox checked={split} onChange={toggleSplit} label="Horários diferentes para agentes, motoristas e veículos" />
        <ul className="divide-y divide-line border-y border-line">
          {dates.map((date) => (
            <li key={date} className="flex flex-wrap items-start gap-x-4 gap-y-1 py-2">
              <span className="num w-16 shrink-0 pt-2 text-sm font-medium">{formatDateTime(date)}</span>
              <div className="flex-1 space-y-1">
                {groups.map((g) => {
                  const s = j.shifts.find((x) => x.date === date && x.group === g.value);
                  const hours = s ? shiftHours(s) : 0;
                  const extra = Math.max(hours - dailyHours, 0);
                  return (
                    <div key={g.value} className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
                      {g.label && <span className="w-20 text-muted">{g.label}</span>}
                      <input className={`input ${cell} !min-h-9 !w-28`} type="time" aria-label={`Entrada ${g.label} ${date}`} value={s?.start ?? ""} onChange={(e) => setShift(date, g.value, { start: e.target.value })} />
                      <span className="text-muted">às</span>
                      <input className={`input ${cell} !min-h-9 !w-28`} type="time" aria-label={`Saída ${g.label} ${date}`} value={s?.end ?? ""} onChange={(e) => setShift(date, g.value, { end: e.target.value })} />
                      {hours > 0 && (
                        <span className="num text-muted">
                          {hoursText(hours)}
                          {extra > 0 && <span className="text-accent"> · {hoursText(extra)} extra</span>}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
        <p className="text-[0.8125rem] text-muted">A diária cobre {hoursText(dailyHours)} por dia (ajuste em Configurações). Saída antes da entrada conta como virada da meia-noite.</p>

        {(rows.length > 0 || hasOvertimeLines) && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Horas extras</h3>
            {rows.length ? (
              <ul className="space-y-1">
                {rows.map((r) => (
                  <li key={r.key} className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
                    <span className="min-w-[8rem] flex-1">{r.label}</span>
                    <span className="num text-muted">{hoursText(r.hours)} ×</span>
                    <MoneyInput value={r.rate} onChange={(v) => setRates({ ...rates, [r.key]: v })} label={`Valor da hora de ${r.label}`} className="!w-28 [&>input]:!min-h-9" />
                    <span className="num w-24 text-right">{r.rate > 0 ? brl.format(r.hours * r.rate) : "sem valor/h"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.8125rem] text-muted">Ninguém passou das {hoursText(dailyHours)}. Recalcular remove as linhas de hora extra.</p>
            )}
            <p className="text-[0.8125rem] text-muted">Valor da hora: diária lançada nos custos ÷ dias ÷ {hoursText(dailyHours)}. Pode editar.</p>
            <Button variant="secondary" onClick={calculate}>
              Calcular horas extras
            </Button>
            {charge !== null && (
              <div className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
                <span>
                  Cobrar do cliente: <strong className="num">{brl.format(charge)}</strong> <span className="text-muted">(mesma margem do serviço)</span>
                </span>
                <Button
                  variant="ghost"
                  className="!min-h-9 !px-3"
                  onClick={() => {
                    props.onAddPrice(charge);
                    setCharge(null);
                  }}
                >
                  Somar ao valor do serviço
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
