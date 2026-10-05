"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Language, LanguagePref } from "@/lib/order";

// Peças visuais do configurador, sem estado próprio (exceto o que o React já dá)

const languages: Language[] = ["pt", "pt-en", "pt-es", "other"];

export function inputClass(invalid = false) {
  return `min-h-12 w-full rounded-xl border bg-ink-2 px-4 py-3 text-base placeholder:text-muted/60 transition-colors duration-300 focus:outline-none focus:border-accent ${
    invalid ? "border-danger" : "border-line hover:border-line-strong"
  }`;
}

export function StepHeader(props: { title: string; hint?: string; tag?: string }) {
  return (
    <header className="mb-6">
      <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[1.5rem] font-semibold tracking-[-0.02em] md:text-[1.75rem]">
        {props.title}
        {props.tag && <span className="label !text-[0.6875rem]">{props.tag}</span>}
      </h2>
      {props.hint && <p className="mt-2 max-w-[60ch] text-sm text-muted">{props.hint}</p>}
    </header>
  );
}

export function Field(props: { label: string; id?: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label id={props.id} className={`block scroll-mt-24 ${props.className ?? ""}`}>
      <span className="label mb-2 block">{props.label}</span>
      {props.children}
      {props.error && <span className="mt-2 block text-sm text-danger">{props.error}</span>}
    </label>
  );
}

export function Chip(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={props.active}
      onClick={props.onClick}
      className={`min-h-11 rounded-full border px-4 text-[0.9375rem] transition-[border-color,background-color,color,transform] duration-300 ease-[var(--ease-snap)] active:scale-[0.97] ${
        props.active ? "border-text bg-text text-ink" : "border-line text-text hover:border-line-strong"
      }`}
    >
      {props.children}
    </button>
  );
}

// Sim / Não com "desmarcar" ao tocar de novo (pergunta é opcional)
export function YesNo(props: { value: boolean | null; onChange: (v: boolean | null) => void; yes: string; no: string }) {
  return (
    <div className="flex gap-2">
      <Chip active={props.value === true} onClick={() => props.onChange(props.value === true ? null : true)}>
        {props.yes}
      </Chip>
      <Chip active={props.value === false} onClick={() => props.onChange(props.value === false ? null : false)}>
        {props.no}
      </Chip>
    </div>
  );
}

// "Não sei, quero sugestão": esconde as quantidades e a equipe sugere na conversa
export function SuggestToggle(props: { active: boolean; onClick: () => void; label: string; note: string }) {
  return (
    <div className="mb-5">
      <Chip active={props.active} onClick={props.onClick}>
        {props.label}
      </Chip>
      {props.active && <p className="mt-3 text-sm text-muted">{props.note}</p>}
    </div>
  );
}

export function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CheckBox({ active }: { active: boolean }) {
  return (
    <span
      className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors duration-300 ${
        active ? "border-accent bg-accent text-ink" : "border-line-strong"
      }`}
    >
      {active && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
    </span>
  );
}

// Idioma do motorista / dos agentes: PT, PT+EN, PT+ES ou outro digitado
export function LanguagePicker(props: { title: string; value: LanguagePref; onChange: (v: LanguagePref) => void; dict: Dictionary }) {
  const t = props.dict.order;
  const { value, onChange } = props;
  return (
    <div className="mt-6">
      <p className="label mb-3">{props.title}</p>
      <div className="flex flex-wrap gap-2">
        {languages.map((l) => (
          <Chip key={l} active={value.choice === l} onClick={() => onChange({ ...value, choice: l })}>
            {t.languages[l]}
          </Chip>
        ))}
      </div>
      {value.choice === "other" && (
        <input
          value={value.other}
          onChange={(e) => onChange({ ...value, other: e.target.value })}
          placeholder={t.otherLanguagePh}
          aria-label={t.languages.other}
          className={`${inputClass()} mt-3`}
        />
      )}
    </div>
  );
}

export function Stepper(props: { value: number; onChange: (n: number) => void; label: string; dict: Dictionary }) {
  const btn =
    "grid size-10 place-items-center rounded-full border border-line text-lg transition-[border-color,transform] duration-300 ease-[var(--ease-snap)] hover:border-silver active:scale-[0.94] disabled:opacity-30 disabled:hover:border-line sm:size-11";
  return (
    <div className="flex items-center gap-1" role="group" aria-label={props.label}>
      <button
        type="button"
        className={btn}
        onClick={() => props.onChange(props.value - 1)}
        disabled={props.value === 0}
        aria-label={`${props.dict.order.decrease}: ${props.label}`}
      >
        −
      </button>
      <output className="num w-8 text-center font-semibold" aria-live="polite">
        {props.value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => props.onChange(props.value + 1)}
        aria-label={`${props.dict.order.increase}: ${props.label}`}
      >
        +
      </button>
    </div>
  );
}

// Renderiza "*Rótulo:* valor" como linhas do resumo; pula o título
export function MessagePreview({ text, compact = false }: { text: string; compact?: boolean }) {
  const lines = text.split("\n").slice(2);
  const labelW = compact ? "w-24" : "w-32";
  const indent = compact ? "pl-[calc(6rem+0.75rem)]" : "pl-[calc(8rem+0.75rem)]";
  return (
    <div className={`space-y-1.5 ${compact ? "text-[0.8125rem]" : "text-sm"}`}>
      {lines.map((line, i) => {
        if (!line) return <div key={i} className="h-2" />;
        const match = line.match(/^\*(.+?):\*\s?(.*)$/);
        if (match) {
          return (
            <p key={i} className="flex gap-3">
              <span className={`${labelW} shrink-0 pt-0.5 text-muted`}>{match[1]}</span>
              <span className="min-w-0 break-words">{match[2]}</span>
            </p>
          );
        }
        return (
          <p key={i} className={`${indent} break-words`}>
            {line.replace(/^• /, "")}
          </p>
        );
      })}
    </div>
  );
}
