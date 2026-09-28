"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";
import {
  buildMessage,
  emptyOrder,
  validateOrder,
  vehicleCount,
  whatsappUrl,
  type Duration,
  type Order,
  type OrderErrors,
} from "@/lib/order";
import type { Locale, SiteContent } from "@/lib/types";

type Props = { content: SiteContent; dict: Dictionary; locale: Locale };

const durations: Duration[] = ["4h", "8h", "12h", "multi"];

export function Configurator({ content, dict, locale }: Props) {
  const t = dict.order;
  const [order, setOrder] = useState<Order>(emptyOrder);
  const [errors, setErrors] = useState<OrderErrors>({});
  const [inView, setInView] = useState(false);
  const [summaryInView, setSummaryInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  const set = <K extends keyof Order>(key: K, value: Order[K]) => {
    setOrder((o) => ({ ...o, [key]: value }));
    if (key === "serviceTypeId" || key === "date" || key === "name") {
      const errorKey = key === "serviceTypeId" ? "service" : key;
      setErrors((e) => ({ ...e, [errorKey]: undefined }));
    }
  };

  const setVehicle = (id: string, qty: number) =>
    setOrder((o) => ({ ...o, vehicles: { ...o.vehicles, [id]: Math.max(0, Math.min(10, qty)) } }));

  // Pré-seleciona o serviço vindo da lista (?servico=id)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("servico");
    if (id && content.serviceTypes.some((s) => s.id === id)) setOrder((o) => ({ ...o, serviceTypeId: id }));
  }, [content.serviceTypes]);

  // Barra fixa do mobile: aparece no configurador, some quando o resumo já está visível
  useEffect(() => {
    const section = sectionRef.current;
    const summary = summaryRef.current;
    if (!section || !summary) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => (e.target === section ? setInView : setSummaryInView)(e.isIntersecting)),
      { threshold: 0.05 },
    );
    io.observe(section);
    io.observe(summary);
    return () => io.disconnect();
  }, []);

  const message = useMemo(() => buildMessage(order, content, dict, locale), [order, content, dict, locale]);
  const vehicles = vehicleCount(order);
  const service = content.serviceTypes.find((s) => s.id === order.serviceTypeId);

  function send() {
    const found = validateOrder(order, dict);
    setErrors(found);
    const first = (["service", "date", "name"] as const).find((k) => found[k]);
    if (first) {
      document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    window.open(whatsappUrl(content.company.whatsapp, message), "_blank", "noopener");
  }

  return (
    <section id="pedido" ref={sectionRef} className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
          <form className="space-y-12" onSubmit={(e) => e.preventDefault()} noValidate>
            {/* 01 · Serviço */}
            <Step n="01" title={t.steps.service} id="field-service" error={errors.service}>
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t.steps.service}>
                {content.serviceTypes.map((s) => {
                  const active = order.serviceTypeId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set("serviceTypeId", s.id)}
                      className={`rounded-2xl border p-4 text-left transition-[border-color,background-color,transform] duration-300 ease-[var(--ease-snap)] active:scale-[0.98] ${
                        active ? "border-accent/70 bg-navy-2" : "border-line bg-navy/40 hover:border-line-strong"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-medium">{s.name[locale]}</span>
                        <Dot active={active} />
                      </span>
                      <span className="mt-1.5 block text-[0.8125rem] leading-relaxed text-muted">{s.summary[locale]}</span>
                    </button>
                  );
                })}
              </div>
            </Step>

            {/* 02 · Veículos */}
            <Step n="02" title={t.steps.vehicles} hint={t.vehiclesHint}>
              <ul className="divide-y divide-line rounded-2xl border border-line bg-navy/40">
                {content.vehicleCategories.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-4 p-4">
                    <span>
                      <span className="block font-medium">{v.name[locale]}</span>
                      <span className="num text-[0.8125rem] text-muted">
                        {v.capacity} {dict.fleet.seats}
                        {v.armored && ` · ${dict.fleet.armored}`}
                      </span>
                    </span>
                    <Stepper
                      value={order.vehicles[v.id] ?? 0}
                      onChange={(n) => setVehicle(v.id, n)}
                      label={v.name[locale]}
                      dict={dict}
                    />
                  </li>
                ))}
              </ul>

              <AnimatePresence initial={false}>
                {vehicles > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="label mb-3 mt-6">{t.steps.driver}</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip active={order.driverLanguage === "pt"} onClick={() => set("driverLanguage", "pt")}>
                        {t.driverPt}
                      </Chip>
                      <Chip active={order.driverLanguage === "en"} onClick={() => set("driverLanguage", "en")}>
                        {t.driverEn}
                      </Chip>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Step>

            {/* 03 · Seguranças */}
            <Step n="03" title={t.steps.guards} hint={t.guardsHint}>
              <div className="flex flex-wrap items-center gap-4">
                <Stepper value={order.guards} onChange={(n) => set("guards", Math.max(0, Math.min(20, n)))} label={t.steps.guards} dict={dict} />
                {order.guards > 0 && (
                  <div className="flex gap-2">
                    <Chip active={order.armed} onClick={() => set("armed", true)}>
                      {t.armed}
                    </Chip>
                    <Chip active={!order.armed} onClick={() => set("armed", false)}>
                      {t.unarmed}
                    </Chip>
                  </div>
                )}
              </div>
            </Step>

            {/* 04 · Logística */}
            <Step n="04" title={t.steps.logistics}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.date} id="field-date" error={errors.date}>
                  <input
                    type="date"
                    value={order.date}
                    onChange={(e) => set("date", e.target.value)}
                    className={inputClass(!!errors.date)}
                  />
                </Field>
                <Field label={t.time}>
                  <input type="time" value={order.time} onChange={(e) => set("time", e.target.value)} className={inputClass()} />
                </Field>
                <Field label={t.origin}>
                  <input value={order.origin} onChange={(e) => set("origin", e.target.value)} placeholder={t.originPh} className={inputClass()} />
                </Field>
                <Field label={t.destination}>
                  <input
                    value={order.destination}
                    onChange={(e) => set("destination", e.target.value)}
                    placeholder={t.destinationPh}
                    className={inputClass()}
                  />
                </Field>
              </div>

              <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="label mb-3">{t.duration}</p>
                  <div className="flex flex-wrap gap-2">
                    {durations.map((d) => (
                      <Chip key={d} active={order.duration === d} onClick={() => set("duration", order.duration === d ? null : d)}>
                        {t.durations[d]}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label mb-3">{t.passengers}</p>
                  <Stepper
                    value={order.passengers}
                    onChange={(n) => set("passengers", Math.max(1, Math.min(50, n)))}
                    label={t.passengers}
                    dict={dict}
                  />
                </div>
              </div>
            </Step>

            {/* 05 · Contato */}
            <Step n="05" title={t.steps.contact}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.name} id="field-name" error={errors.name}>
                  <input
                    value={order.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder={t.namePh}
                    autoComplete="name"
                    className={inputClass(!!errors.name)}
                  />
                </Field>
                <Field label={t.company}>
                  <input
                    value={order.company}
                    onChange={(e) => set("company", e.target.value)}
                    placeholder={t.companyPh}
                    autoComplete="organization"
                    className={inputClass()}
                  />
                </Field>
                <Field label={t.notes} className="sm:col-span-2">
                  <textarea
                    value={order.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder={t.notesPh}
                    rows={3}
                    className={`${inputClass()} resize-none`}
                  />
                </Field>
              </div>
            </Step>
          </form>

          {/* Resumo: exatamente o texto que vai pro WhatsApp */}
          <aside ref={summaryRef} className="lg:sticky lg:top-24 lg:self-start" aria-live="polite">
            <div className="rounded-3xl border border-line-strong bg-navy/60">
              <div className="flex items-center justify-between border-b border-dashed border-line-strong px-6 py-4">
                <p className="label">{t.summary}</p>
                <span className="label">{locale.toUpperCase()}</span>
              </div>
              <div className="px-6 py-5">
                {service ? <MessagePreview text={message} /> : <p className="text-sm text-muted">{t.empty}</p>}
              </div>
              <div className="border-t border-dashed border-line-strong p-4">
                <button
                  type="button"
                  onClick={send}
                  className="btn btn-primary w-full"
                >
                  {t.send}
                </button>
              </div>
            </div>
            <a
              href={whatsappUrl(content.company.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="lift mt-4 block rounded-3xl border border-line p-5"
            >
              <span className="block font-medium">{t.asideTitle}</span>
              <span className="mt-1 block text-sm text-muted">{t.asideText} <span className="text-accent">›</span></span>
            </a>
          </aside>
        </div>
      </div>

      {/* Barra fixa no mobile */}
      <AnimatePresence>
        {inView && !summaryInView && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-ink/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-[16px] backdrop-saturate-[180%] lg:hidden"
          >
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1 truncate text-sm">
                {service ? service.name[locale] : <span className="text-muted">{t.empty}</span>}
                {(vehicles > 0 || order.guards > 0) && (
                  <span className="num block text-xs text-muted">
                    {vehicles > 0 && `${vehicles} ${dict.message.vehicles.toLowerCase()}`}
                    {vehicles > 0 && order.guards > 0 && " · "}
                    {order.guards > 0 && `${order.guards} ${dict.message.guards.toLowerCase()}`}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={send}
                className="btn btn-primary shrink-0 !px-5 !text-[0.9375rem]"
              >
                {t.send}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ——— Peças internas ——— */

function inputClass(invalid = false) {
  return `min-h-12 w-full rounded-xl border bg-navy/40 px-4 py-3 text-base placeholder:text-muted/60 transition-colors duration-300 focus:outline-none focus:border-accent ${
    invalid ? "border-danger" : "border-line hover:border-line-strong"
  }`;
}

function Step(props: { n: string; title: string; hint?: string; id?: string; error?: string; children: React.ReactNode }) {
  return (
    <fieldset id={props.id} className="scroll-mt-24">
      <legend className="mb-5 flex w-full items-baseline gap-3">
        <span className="num text-[0.9375rem] font-semibold text-muted">{props.n}</span>
        <span className="text-[1.375rem] font-semibold tracking-[-0.02em]">{props.title}</span>
      </legend>
      {props.hint && <p className="-mt-3 mb-4 text-sm text-muted">{props.hint}</p>}
      {props.children}
      {props.error && <p className="mt-3 text-sm text-danger">{props.error}</p>}
    </fieldset>
  );
}

function Field(props: { label: string; id?: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label id={props.id} className={`block scroll-mt-24 ${props.className ?? ""}`}>
      <span className="label mb-2 block">{props.label}</span>
      {props.children}
      {props.error && <span className="mt-2 block text-sm text-danger">{props.error}</span>}
    </label>
  );
}

function Chip(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

function Dot({ active }: { active: boolean }) {
  return (
    <span className={`grid size-4 shrink-0 place-items-center rounded-full border ${active ? "border-accent" : "border-line-strong"}`}>
      {active && <span className="size-2 rounded-full bg-accent" />}
    </span>
  );
}

function Stepper(props: { value: number; onChange: (n: number) => void; label: string; dict: Dictionary }) {
  const btn =
    "grid size-11 place-items-center rounded-full border border-line text-lg transition-[border-color,transform] duration-300 ease-[var(--ease-snap)] hover:border-silver active:scale-[0.94] disabled:opacity-30 disabled:hover:border-line";
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
function MessagePreview({ text }: { text: string }) {
  const lines = text.split("\n").slice(2);
  return (
    <div className="space-y-1.5 text-sm">
      {lines.map((line, i) => {
        if (!line) return <div key={i} className="h-2" />;
        const match = line.match(/^\*(.+?):\*\s?(.*)$/);
        if (match) {
          return (
            <p key={i} className="flex gap-3">
              <span className="w-28 shrink-0 pt-0.5 text-[0.8125rem] text-muted">{match[1]}</span>
              <span className="min-w-0 break-words">{match[2]}</span>
            </p>
          );
        }
        return (
          <p key={i} className="pl-[calc(7rem+0.75rem)] break-words">
            {line.replace(/^• /, "")}
          </p>
        );
      })}
    </div>
  );
}
