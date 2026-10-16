"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Check as IconCheck,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevron,
  LoaderCircle as IconLoader,
  Search as IconSearch,
  X as IconClose,
} from "lucide-react";

import { formatDoc, formatPhone } from "@/lib/admin/labels";
import { useSaving } from "@/lib/admin/store";


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
  href?: string; // abre o item em outra tela (ex.: o serviço a partir do Início)
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
        {props.subtitle && <span className="mt-0.5 line-clamp-2 text-[0.875rem] text-muted">{props.subtitle}</span>}
      </span>
      {props.trailing && <span className="shrink-0 text-right">{props.trailing}</span>}
    </>
  );
  const clickable = "flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left transition-colors duration-200 hover:bg-navy-2 active:bg-navy-2";
  return (
    <li>
      {props.href ? (
        <Link href={props.href} className={clickable}>
          {content}
        </Link>
      ) : props.onClick ? (
        <button
          type="button"
          onClick={props.onClick}
          className={clickable}
        >
          {content}
        </button>
      ) : (
        <div className="flex min-h-16 items-center gap-4 px-4 py-3">{content}</div>
      )}
    </li>
  );
}

// Marcador de seleção (modo "Exportar PDF" das listas)
export function PickMark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
        on ? "border-[#34c759] bg-[#34c759] text-ink" : "border-line-strong"
      }`}
    >
      {on && <IconCheck className="size-3.5" />}
    </span>
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
    <div className="@container min-w-0 rounded-2xl border border-line bg-navy/60 p-4 sm:p-5">
      <p className="text-[0.875rem] text-muted">{props.label}</p>
      {/* Fonte acompanha a largura do card (cqi), não da tela: valor cabe com a barra lateral aberta */}
      <p className={`num mt-2 truncate text-[clamp(0.9375rem,12cqi,1.625rem)] font-semibold tracking-[-0.02em] ${tone}`}>{props.value}</p>
    </div>
  );
}

// Placeholder enquanto as tabelas carregam: evita "vazio" e R$ 0,00 falsos
export function Skeleton(props: { rows?: number; stats?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando" className="animate-pulse space-y-6">
      {!!props.stats && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: props.stats }, (_, i) => (
            <div key={i} className="h-[5.75rem] rounded-2xl border border-line bg-navy/60 sm:h-[6.5rem]" />
          ))}
        </div>
      )}
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-navy/60">
        {Array.from({ length: props.rows ?? 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4">
            <div className="h-9 w-9 shrink-0 rounded-full bg-white/6" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/5 rounded bg-white/8" />
              <div className="h-3 w-3/5 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
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

// Navegação de mês/ano do Financeiro e dos Relatórios; "Hoje" só aparece fora do período atual
export function PeriodStepper(props: { label: string; onStep: (delta: -1 | 1) => void; onToday?: () => void; prevLabel: string; nextLabel: string }) {
  const arrow = "grid size-9 place-items-center rounded-full hover:bg-white/6";
  return (
    <div className="flex items-center gap-2">
      {props.onToday && (
        <button type="button" onClick={props.onToday} className="min-h-11 rounded-full px-3 text-[0.875rem] font-medium text-accent hover:bg-accent/10">
          Hoje
        </button>
      )}
      <div className="flex items-center gap-1 rounded-full border border-line p-1">
        <button type="button" onClick={() => props.onStep(-1)} aria-label={props.prevLabel} className={arrow}>
          <IconChevronLeft className="size-4" />
        </button>
        <span className="min-w-36 text-center text-[0.9375rem] font-medium">{props.label}</span>
        <button type="button" onClick={() => props.onStep(1)} aria-label={props.nextLabel} className={arrow}>
          <IconChevron className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ——— Botões ——— */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

// Mesmo visual do Button para links (<Link className={buttonClass("primary")}>)
export function buttonClass(variant: ButtonVariant = "primary") {
  const styles = {
    primary: "bg-text text-ink hover:bg-white",
    secondary: "border border-line-strong hover:border-silver",
    danger: "text-danger hover:bg-danger/10",
    ghost: "text-accent hover:bg-accent/10",
  }[variant];
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.9375rem] font-medium transition-[background-color,border-color,transform] duration-300 ease-[var(--ease-snap)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${styles}`;
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const { variant = "primary", className = "", ...rest } = props;
  return <button type="button" {...rest} className={`${buttonClass(variant)} ${className}`} />;
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

// Texto longo: cresce com o conteúdo (rows é a altura mínima), sem barra de rolagem interna
export function TextArea({ rows = 3, className = "", onInput, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`; // + borda
  };
  useLayoutEffect(fit, [rest.value]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // largura muda (girar o celular, abrir a janela) → recalcula a altura
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <textarea
      ref={ref}
      rows={rows}
      {...rest}
      onInput={(e) => {
        fit();
        onInput?.(e);
      }}
      className={`input resize-none overflow-hidden leading-relaxed ${className}`}
    />
  );
}

// Número compacto: largura pelo tamanho do valor esperado (digits), unidade ao lado
// e o campo pode ficar vazio enquanto digita (sem voltar para 0 sozinho)
export function NumberInput(props: {
  value: number | null;
  onChange: (v: number | null) => void;
  digits?: number;
  suffix?: string;
  min?: number;
  max?: number;
  decimal?: boolean;
  fallback?: number; // valor quando o campo fica vazio (para números obrigatórios)
  label?: string;
  placeholder?: string;
  className?: string;
}) {
  const show = (v: number | null) => (v == null ? "" : String(v).replace(".", ","));
  const [text, setText] = useState(show(props.value));
  const emitted = useRef(props.value);
  useEffect(() => {
    // só reescreve o texto quando o valor mudou por fora (ex.: itens refeitos pelo escopo)
    if (props.value !== emitted.current) {
      emitted.current = props.value;
      setText(show(props.value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  const width = `calc(${Math.max(props.digits ?? 3, 2)}ch + 1.75rem + 2px)`;
  return (
    <span className={`inline-flex max-w-full items-center gap-2 ${props.className ?? ""}`}>
      <input
        className="input num text-center"
        style={{ width }}
        inputMode={props.decimal ? "decimal" : "numeric"}
        aria-label={props.label}
        placeholder={props.placeholder}
        value={text}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const raw = e.target.value.replace(props.decimal ? /[^\d,.]/g : /\D/g, "");
          setText(raw);
          let v: number | null = raw === "" ? (props.fallback ?? null) : Number(raw.replace(",", "."));
          if (v != null && !Number.isFinite(v)) v = props.fallback ?? null;
          if (v != null && props.max != null) v = Math.min(v, props.max);
          emitted.current = v;
          props.onChange(v);
        }}
        onBlur={() => {
          // mínimo aplicado ao sair do campo, para não atrapalhar a digitação
          const v = props.value != null && props.min != null ? Math.max(props.min, props.value) : props.value;
          if (v !== props.value) {
            emitted.current = v;
            props.onChange(v);
          }
          setText(show(v));
        }}
      />
      {props.suffix && <span className="shrink-0 text-[0.9375rem] text-muted">{props.suffix}</span>}
    </span>
  );
}

// Telefone formatado enquanto digita; guarda só os dígitos (com "+" na frente se for estrangeiro)
export function PhoneInput(props: { value: string; onChange: (v: string) => void; label?: string; placeholder?: string }) {
  return (
    <input
      className="input num"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      aria-label={props.label}
      placeholder={props.placeholder ?? "(11) 99999-9999"}
      value={formatPhone(props.value)}
      onChange={(e) => {
        const text = e.target.value;
        const digits = text.replace(/\D/g, "").slice(0, 15);
        props.onChange(text.trim().startsWith("+") && digits ? `+${digits}` : digits);
      }}
    />
  );
}

// CPF vira 123.456.789-01 ao completar 11 dígitos (e é salvo só com dígitos); RG e outros ficam livres
export function DocInput(props: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <input
      className="input num"
      aria-label={props.label}
      placeholder="CPF, RG ou CNV"
      value={formatDoc(props.value)}
      onChange={(e) => {
        const text = e.target.value;
        const digits = text.replace(/\D/g, "");
        props.onChange(/^[\d.\-\s]*$/.test(text) && digits.length === 11 ? digits : text);
      }}
    />
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

// Controle segmentado (filtros, tipo de lançamento). No celular quebra linha em vez de esconder opções
export function Segmented<T extends string>(props: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex max-w-full flex-wrap rounded-[1.375rem] bg-white/6 p-1 sm:flex-nowrap sm:overflow-x-auto sm:rounded-full" role="tablist">
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

/* ——— Painel de edição (janela central no desktop, tela cheia no celular) ——— */

export function Sheet(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  error?: string;
  // Formulário com alterações não salvas: fechar pelo X, Esc ou fundo pede confirmação
  dirty?: boolean;
}) {
  const { open, onClose, dirty } = props;
  const saving = useSaving();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return setConfirming(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (dirty) setConfirming((c) => !c);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, dirty]);

  const requestClose = () => (dirty ? setConfirming(true) : onClose());

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:p-6" role="dialog" aria-modal="true" aria-label={props.title}>
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={requestClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}
          />
          <motion.div
            className="relative flex h-full w-full flex-col overflow-hidden bg-ink-2 md:h-auto md:max-h-[min(90vh,56rem)] md:max-w-2xl md:rounded-2xl md:border md:border-line md:shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            {confirming ? (
              <div role="alert" className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-danger/10 px-5 py-2.5">
                <p className="font-medium">Descartar as alterações?</p>
                <div className="flex gap-2">
                  <Button variant="secondary" className="!min-h-10" onClick={() => setConfirming(false)}>
                    Continuar editando
                  </Button>
                  <Button variant="danger" className="!min-h-10 bg-danger/15" onClick={onClose}>
                    Descartar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line px-5">
                <h2 className="truncate text-lg font-semibold tracking-[-0.02em]">{props.title}</h2>
                <button type="button" onClick={requestClose} aria-label="Fechar" className="grid size-11 place-items-center rounded-full hover:bg-white/6">
                  <IconClose className="size-5" />
                </button>
              </div>
            )}
            {/* Durante uma gravação a janela inteira trava: nada de toque duplo nem edição no meio do salvar */}
            <fieldset disabled={saving} className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">{props.children}</div>
              {props.footer && (
                <div className="shrink-0 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  {props.error && (
                    <p role="alert" className="mb-3 text-[0.875rem] text-danger">
                      {props.error}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    {props.footer}
                    {saving && (
                      <span aria-live="polite" className="ml-auto flex items-center gap-2 text-[0.875rem] text-muted">
                        <IconLoader className="size-4 animate-spin" /> Salvando…
                      </span>
                    )}
                  </div>
                </div>
              )}
            </fieldset>
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
  const [start] = useState(initial);
  const set = <K extends keyof T>(key: K, v: T[K]) => setValue((prev) => ({ ...prev, [key]: v }));
  const dirty = JSON.stringify(value) !== JSON.stringify(start);
  return { value, set, reset: setValue, dirty };
}
