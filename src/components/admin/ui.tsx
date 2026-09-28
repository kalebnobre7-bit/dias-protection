"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Search as IconSearch, X as IconClose } from "lucide-react";


/* ——— Estrutura de página ——— */

export function PageHeader(props: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.03em]">{props.title}</h1>
        {props.subtitle && <p className="mt-1 text-[0.9375rem] text-muted">{props.subtitle}</p>}
      </div>
      {props.action}
    </header>
  );
}

export function Section(props: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={props.className}>
      {(props.title || props.action) && (
        <div className="mb-3 flex items-center justify-between gap-4 px-1">
          {props.title && <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-muted">{props.title}</h2>}
          {props.action}
        </div>
      )}
      {props.children}
    </section>
  );
}

// Lista agrupada no estilo Ajustes do iOS
export function List({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-navy/60">{children}</ul>;
}

export function Row(props: {
  onClick?: () => void;
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const content = (
    <>
      {props.leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{props.title}</span>
        {props.subtitle && <span className="mt-0.5 block truncate text-[0.875rem] text-muted">{props.subtitle}</span>}
      </span>
      {props.trailing && <span className="shrink-0 text-right">{props.trailing}</span>}
    </>
  );
  return (
    <li>
      {props.onClick ? (
        <button
          type="button"
          onClick={props.onClick}
          className="flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left transition-colors duration-200 hover:bg-navy-2 active:bg-navy-2"
        >
          {content}
        </button>
      ) : (
        <div className="flex min-h-16 items-center gap-4 px-4 py-3">{content}</div>
      )}
    </li>
  );
}

export function EmptyState(props: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
      <p className="font-semibold">{props.title}</p>
      {props.text && <p className="mx-auto mt-1 max-w-[40ch] text-[0.9375rem] text-muted">{props.text}</p>}
      {props.action && <div className="mt-5">{props.action}</div>}
    </div>
  );
}

export function Stat(props: { label: string; value: string; tone?: "default" | "good" | "bad" | "muted" }) {
  const tone = { default: "text-text", good: "text-[#8fd6a5]", bad: "text-danger", muted: "text-silver" }[props.tone ?? "default"];
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-navy/60 p-4 sm:p-5">
      <p className="text-[0.875rem] text-muted">{props.label}</p>
      <p className={`num mt-2 truncate text-[clamp(1.0625rem,4.4vw,1.625rem)] font-semibold tracking-[-0.02em] ${tone}`}>{props.value}</p>
    </div>
  );
}

export function Badge(props: { children: React.ReactNode; tone?: "neutral" | "accent" | "good" | "warn" | "bad" }) {
  const tone = {
    neutral: "bg-white/8 text-silver",
    accent: "bg-accent/15 text-accent",
    good: "bg-[#8fd6a5]/15 text-[#8fd6a5]",
    warn: "bg-[#e8c27a]/15 text-[#e8c27a]",
    bad: "bg-danger/15 text-danger",
  }[props.tone ?? "neutral"];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{props.children}</span>;
}

export function Avatar({ name, photo }: { name: string; photo?: string | null }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return photo ? (
    <img src={photo} alt="" className="size-10 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy-2 text-sm font-semibold text-silver">{initials || "?"}</span>
  );
}

export function SearchBox(props: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative mb-4 block">
      <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <span className="sr-only">Buscar</span>
      <input className="input !pl-10" type="search" value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} />
    </label>
  );
}

/* ——— Botões ——— */

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" },
) {
  const { variant = "primary", className = "", ...rest } = props;
  const styles = {
    primary: "bg-text text-ink hover:bg-white",
    secondary: "border border-line-strong hover:border-silver",
    danger: "text-danger hover:bg-danger/10",
    ghost: "text-accent hover:bg-accent/10",
  }[variant];
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.9375rem] font-medium transition-[background-color,border-color,transform] duration-300 ease-[var(--ease-snap)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${styles} ${className}`}
    />
  );
}

/* ——— Campos ——— */

export function Field(props: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${props.className ?? ""}`}>
      <span className="mb-1.5 block text-[0.875rem] font-medium text-silver">{props.label}</span>
      {props.children}
      {props.hint && <span className="mt-1.5 block text-xs text-muted">{props.hint}</span>}
    </label>
  );
}

export function Switch(props: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block font-medium">{props.label}</span>
        {props.hint && <span className="block text-[0.8125rem] text-muted">{props.hint}</span>}
      </span>
      <span className="relative">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={props.checked}
          onChange={(e) => props.onChange(e.target.checked)}
        />
        <span className="block h-7 w-12 rounded-full bg-white/12 transition-colors duration-300 peer-checked:bg-[#34c759] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
        <span className="absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-300 ease-[var(--ease-snap)] peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

// Controle segmentado (filtros, tipo de lançamento)
export function Segmented<T extends string>(props: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-full bg-white/6 p-1" role="tablist">
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={props.value === o.value}
          onClick={() => props.onChange(o.value)}
          className={`min-h-9 shrink-0 rounded-full px-4 text-[0.875rem] font-medium transition-colors duration-200 ${
            props.value === o.value ? "bg-navy-2 text-text shadow" : "text-muted hover:text-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Seleção múltipla em chips (agentes e veículos do serviço)
export function ChipSelect(props: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; empty: string }) {
  if (!props.options.length) return <p className="text-[0.875rem] text-muted">{props.empty}</p>;
  const toggle = (id: string) =>
    props.onChange(props.value.includes(id) ? props.value.filter((v) => v !== id) : [...props.value, id]);
  return (
    <div className="flex flex-wrap gap-2">
      {props.options.map((o) => {
        const on = props.value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o.value)}
            className={`min-h-10 rounded-full border px-4 text-[0.875rem] transition-colors duration-200 ${
              on ? "border-text bg-text text-ink" : "border-line hover:border-line-strong"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ——— Painel de edição (lateral no desktop, tela cheia no celular) ——— */

export function Sheet(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  error?: string;
}) {
  const { open, onClose } = props;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={props.title}>
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}
          />
          <motion.div
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-line bg-ink-2"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line px-5">
              <h2 className="truncate text-lg font-semibold tracking-[-0.02em]">{props.title}</h2>
              <button type="button" onClick={onClose} aria-label="Fechar" className="grid size-11 place-items-center rounded-full hover:bg-white/6">
                <IconClose className="size-5" />
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">{props.children}</div>
            {props.footer && (
              <div className="shrink-0 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {props.error && (
                  <p role="alert" className="mb-3 text-[0.875rem] text-danger">
                    {props.error}
                  </p>
                )}
                <div className="flex items-center gap-3">{props.footer}</div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Botão de excluir com confirmação no segundo toque
export function DeleteButton({ onConfirm, label = "Excluir" }: { onConfirm: () => void; label?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Button variant="danger" onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? "Toque de novo para confirmar" : label}
    </Button>
  );
}

// Estado de formulário genérico para os painéis de edição
export function useForm<T>(initial: T) {
  const [value, setValue] = useState(initial);
  const set = <K extends keyof T>(key: K, v: T[K]) => setValue((prev) => ({ ...prev, [key]: v }));
  return { value, set, reset: setValue };
}
