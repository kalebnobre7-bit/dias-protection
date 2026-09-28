"use client";

import { useState } from "react";

import type { JobStatus } from "@/lib/admin/types";

export const statusTone = (s: JobStatus) =>
  (({ quote: "warn", scheduled: "accent", done: "good", canceled: "bad" }) as const)[s];

// Dia e mês em destaque, como no app Calendário
export function DateTile({ value }: { value: string }) {
  if (!value) return <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-navy-2 text-xs text-muted">·</span>;
  const d = new Date(value);
  return (
    <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-navy-2 leading-none">
      <span className="text-[0.625rem] font-semibold uppercase text-danger">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
      <span className="num mt-0.5 text-lg font-semibold">{d.getDate()}</span>
    </span>
  );
}

// Campo de dinheiro: aceita "1.500,50" ou "1500.5"
export function MoneyInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label?: string }) {
  const [text, setText] = useState(value ? String(value).replace(".", ",") : "");
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">R$</span>
      <input
        className="input num !pl-10"
        inputMode="decimal"
        aria-label={label}
        value={text}
        placeholder="0,00"
        onChange={(e) => {
          setText(e.target.value);
          const raw = e.target.value.trim();
          const n = Number(raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw);
          onChange(Number.isFinite(n) ? n : 0);
        }}
      />
    </span>
  );
}
