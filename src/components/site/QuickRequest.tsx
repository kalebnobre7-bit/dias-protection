"use client";

import { ArrowRight, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";
import { emptyOrder, whatsappUrl, type Order, type ServiceOption } from "@/lib/order";
import type { Locale } from "@/lib/types";

import { Chip, Field, inputClass } from "./Configurator";

type Props = { dict: Dictionary; locale: Locale; options: Pick<ServiceOption, "id" | "name">[]; whatsapp: string };
type Errors = Partial<Record<"name" | "phone" | "email", string>>;

const emailOk = (s: string) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Pop-up de orçamento: botão fixo no site → contato + o essencial, gravado em site_requests
// para virar prévia de proposta no painel (Propostas → Solicitações do site)
export function QuickRequest({ dict, locale, options, whatsapp }: Props) {
  const t = dict.quick;
  const m = dict.message;
  const pathname = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  const [services, setServices] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [trap, setTrap] = useState(""); // campo escondido: só robô preenche
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "failed" | "done">("idle");

  // A página do pedido completo já tem a própria barra fixa
  if (/\/solicitar\/?$/.test(pathname)) return null;

  const chosen = options.filter((o) => services.includes(o.id)).map((o) => o.name);
  const digits = phone.replace(/\D/g, "");
  // Com "+" é estrangeiro e já tem DDI; o painel só põe 55 no que vier sem
  const stored = phone.trim().startsWith("+") ? `+${digits}` : digits;

  const lines = [`*${m.title}*`, ""];
  const add = (label: string, value: string) => value && lines.push(`*${label}:* ${value}`);
  if (chosen.length === 1) add(m.service, chosen[0]);
  else if (chosen.length > 1) lines.push(`*${m.services}:*`, ...chosen.map((n) => `• ${n}`));
  add(m.date, date && new Date(`${date}T12:00:00`).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US"));
  add(m.contact, name.trim());
  add(dict.order.company, company.trim());
  add(t.phone, phone.trim());
  add(t.email, email.trim());
  add(m.notes, note.trim());
  const message = lines.join("\n");

  function open() {
    ref.current?.showModal();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    const found: Errors = {};
    if (!name.trim()) found.name = dict.order.errors.name;
    if (digits.length < 10 || digits.length > 15) found.phone = t.errors.phone;
    if (!emailOk(email.trim())) found.email = t.errors.email;
    setErrors(found);
    if (Object.keys(found).length) return;
    if (trap) {
      setState("done");
      return;
    }
    setState("sending");
    const order: Order = { ...emptyOrder, services, date, name: name.trim(), company: company.trim(), notes: note.trim() };
    try {
      const { getBrowserClient } = await import("@/lib/supabase");
      const { error } = await getBrowserClient()
        .from("site_requests")
        .insert({ id: crypto.randomUUID(), payload: { order, locale, message, contact: { phone: stored, email: email.trim() }, source: "popup" } });
      setState(error ? "failed" : "done");
    } catch {
      setState("failed");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="btn btn-primary fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 shadow-[0_8px_30px_rgba(0,0,0,0.45)] md:bottom-6 md:right-6"
      >
        {t.open}
      </button>

      <dialog
        ref={ref}
        aria-labelledby="quick-title"
        onClick={(e) => e.target === ref.current && ref.current.close()}
        className="m-auto w-[min(100%-2rem,34rem)] rounded-2xl border border-line bg-ink-2 p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="p-5 md:p-7">
          <header className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="quick-title" className="text-[1.375rem] font-semibold tracking-[-0.02em]">
                {state === "done" ? t.doneTitle : t.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{state === "done" ? t.doneText : t.lead}</p>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label={t.close}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line hover:border-line-strong"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          {state === "done" ? (
            <a href={whatsappUrl(whatsapp, message)} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
              <MessageCircle className="size-4" aria-hidden /> {t.whatsapp}
            </a>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              <div>
                <span className="label mb-2 block">{t.services}</span>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t.services}>
                  {options.map((o) => (
                    <Chip
                      key={o.id}
                      active={services.includes(o.id)}
                      onClick={() => setServices((s) => (s.includes(o.id) ? s.filter((x) => x !== o.id) : [...s, o.id]))}
                    >
                      {o.name}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={dict.order.name} error={errors.name}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={dict.order.namePh}
                    autoComplete="name"
                    maxLength={120}
                    className={inputClass(!!errors.name)}
                  />
                </Field>
                <Field label={t.phone} error={errors.phone}>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phonePh}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={25}
                    className={inputClass(!!errors.phone)}
                  />
                </Field>
                <Field label={t.email} error={errors.email}>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPh}
                    type="email"
                    autoComplete="email"
                    maxLength={120}
                    className={inputClass(!!errors.email)}
                  />
                </Field>
                <Field label={dict.order.company}>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder={dict.order.companyPh}
                    autoComplete="organization"
                    maxLength={120}
                    className={inputClass()}
                  />
                </Field>
                <Field label={t.date} className="sm:col-span-2">
                  <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className={inputClass()} />
                </Field>
              </div>
              <Field label={t.message}>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.messagePh}
                  rows={3}
                  maxLength={1000}
                  className={`${inputClass()} resize-none`}
                />
              </Field>
              <input
                value={trap}
                onChange={(e) => setTrap(e.target.value)}
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute -left-[9999px] size-px opacity-0"
              />
              {state === "failed" && <p className="text-sm text-danger">{t.failed}</p>}
              <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full disabled:opacity-50">
                {state === "sending" ? t.sending : t.send}
              </button>
              <p className="text-center text-xs text-muted">{t.privacy}</p>
              <Link
                href={`/${locale}/solicitar`}
                onClick={() => ref.current?.close()}
                className="flex items-center justify-center gap-1 text-sm text-accent"
              >
                {t.detailed} <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
