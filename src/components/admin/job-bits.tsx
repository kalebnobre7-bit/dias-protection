"use client";

import { useEffect, useRef, useState } from "react";

import type { JobStatus } from "@/lib/admin/types";

export const statusTone = (s: JobStatus) =>
  (({ quote: "warn", scheduled: "accent", done: "good", canceled: "bad" }) as const)[s];

// Dia e mês em destaque, como no app Calendário
export function DateTile({ value }: { value: string }) {
  if (!value) return <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-navy-2 text-xs text-muted">·</span>;
  const d = new Date(value);
  return (
    <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-navy-2 leading-none">
      <span className="text-[0.5625rem] font-semibold uppercase text-danger">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
      <span className="num mt-0.5 text-base font-semibold">{d.getDate()}</span>
    </span>
  );
}

// Número da proposta no mesmo formato do DateTile: ano em cima, sequência embaixo ("2026-003")
export function NumberTile({ number }: { number: string }) {
  return (
    <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-navy-2 leading-none">
      <span className="num text-[0.5625rem] font-semibold text-muted">{number.slice(0, 4)}</span>
      <span className="num mt-0.5 text-base font-semibold">{number.slice(5)}</span>
    </span>
  );
}

// "1.500,50", "1500.5" ou "1.500" (milhar) → número
export function parseMoney(raw: string): number {
  const t = raw.trim().replace(/[^\d,.]/g, "");
  if (!t) return 0;
  const n = t.includes(",")
    ? Number(t.replace(/\./g, "").replace(",", "."))
    : /^\d{1,3}(\.\d{3})+$/.test(t)
      ? Number(t.replace(/\./g, ""))
      : Number(t);
  return Number.isFinite(n) ? n : 0;
}

const showMoney = (v: number) => (v ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");

// Campo de dinheiro: R$ na frente, formata ao sair ("1.500,00") e acompanha mudanças de fora
export function MoneyInput({ value, onChange, label, className = "" }: { value: number; onChange: (v: number) => void; label?: string; className?: string }) {
  const [text, setText] = useState(showMoney(value));
  const emitted = useRef(value);
  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      setText(showMoney(value));
    }
  }, [value]);
  return (
    <span className={`relative block w-full max-w-[13rem] ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.8125rem] text-muted">R$</span>
      <input
        className="input num !pl-9 text-right"
        inputMode="decimal"
        aria-label={label}
        value={text}
        placeholder="0,00"
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseMoney(e.target.value);
          emitted.current = n;
          onChange(n);
        }}
        onBlur={() => setText(showMoney(value))}
      />
    </span>
  );
}
