"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";
import {
  buildMessage,
  emptyOrder,
  guardCount,
  optionsForService,
  serviceOptions,
  usesPeriod,
  validateOrder,
  vehicleCount,
  whatsappUrl,
  type EventKind,
  type Exposure,
  type Language,
  type LanguagePref,
  type Order,
  type OrderErrors,
  type TripNeed,
} from "@/lib/order";
import type { Locale, SiteContent } from "@/lib/types";

type Props = { content: SiteContent; dict: Dictionary; locale: Locale };

const languages: Language[] = ["pt", "pt-en", "pt-es", "other"];
const tripNeeds: TripNeed[] = ["vehicle", "driver", "guards"];
const eventKinds: EventKind[] = ["sports", "show", "corporate", "social", "political", "other"];
const exposures: Exposure[] = ["no", "public", "pep"];

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
    if (key === "date" || key === "name") setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setVehicle = (id: string, qty: number) =>
    setOrder((o) => ({ ...o, vehicles: { ...o.vehicles, [id]: Math.max(0, Math.min(10, qty)) } }));

  const toggleTripNeed = (need: TripNeed) =>
    setOrder((o) => ({
      ...o,
      tripNeeds: o.tripNeeds.includes(need) ? o.tripNeeds.filter((n) => n !== need) : [...o.tripNeeds, need],
    }));

  const toggleService = (id: string) => {
    setOrder((o) =>
      o.services.includes(id) ? { ...o, services: o.services.filter((s) => s !== id) } : withServices(o, [id]),
    );
    setErrors((e) => ({ ...e, service: undefined }));
  };

  // Pré-seleciona o serviço vindo da lista (?servico=id)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("servico");
    if (id && content.serviceTypes.some((s) => s.id === id)) setOrder((o) => withServices(o, optionsForService(id)));
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
  const options = useMemo(() => serviceOptions(content, dict, locale), [content, dict, locale]);
  const chosen = options.filter((o) => order.services.includes(o.id));
  const vehicles = vehicleCount(order);
  const guards = guardCount(order);
  const period = usesPeriod(order);

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
            <Step n="01" title={t.steps.service} hint={t.serviceHint} id="field-service" error={errors.service}>
              <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label={t.steps.service}>
                {options.map((s) => {
                  const active = order.services.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="checkbox"
                      aria-checked={active}
                      onClick={() => toggleService(s.id)}
                      className={`rounded-2xl border p-4 text-left transition-[border-color,background-color,transform] duration-300 ease-[var(--ease-snap)] active:scale-[0.98] ${
                        active ? "border-accent/70 bg-navy-2" : "border-line bg-navy/40 hover:border-line-strong"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-medium">{s.name}</span>
                        <CheckBox active={active} />
                      </span>
                      <span className="mt-1.5 block text-[0.8125rem] leading-relaxed text-muted">{s.summary}</span>
                    </button>
                  );
                })}
              </div>
            </Step>

            {/* 02 · Veículos */}
            <Step n="02" title={t.steps.vehicles} hint={t.vehiclesHint}>
              <SuggestToggle
                active={order.vehiclesSuggest}
                onClick={() => setOrder((o) => ({ ...o, vehiclesSuggest: !o.vehiclesSuggest, vehicles: {} }))}
                label={t.suggest}
                note={t.suggestNote}
              />
              <Collapse open={!order.vehiclesSuggest}>
                <ul className="divide-y divide-line rounded-2xl border border-line bg-navy/40">
                  {content.vehicleCategories.map((v) => (
                    <li key={v.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                      {v.image && (
                        <Image
                          src={v.image}
                          alt=""
                          width={96}
                          height={72}
                          sizes="96px"
                          className={`h-12 w-16 shrink-0 object-contain transition-transform duration-500 ease-[var(--ease-snap)] sm:h-16 sm:w-24 ${
                            (order.vehicles[v.id] ?? 0) > 0 ? "scale-110" : ""
                          }`}
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.9375rem] font-medium leading-snug sm:text-base">{v.name[locale]}</span>
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
              </Collapse>

              <AnimatePresence initial={false}>
                {(vehicles > 0 || order.vehiclesSuggest) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <LanguagePicker
                      title={t.steps.driver}
                      value={order.driverLanguage}
                      onChange={(v) => set("driverLanguage", v)}
                      dict={dict}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Step>

            {/* 03 · Seguranças */}
            <Step n="03" title={t.steps.guards} hint={t.guardsHint}>
              <SuggestToggle
                active={order.guardsSuggest}
                onClick={() => setOrder((o) => ({ ...o, guardsSuggest: !o.guardsSuggest, guardsArmed: 0, guardsUnarmed: 0 }))}
                label={t.suggest}
                note={t.suggestNote}
              />
              <Collapse open={!order.guardsSuggest}>
                <ul className="divide-y divide-line rounded-2xl border border-line bg-navy/40">
                  {(
                    [
                      ["guardsArmed", t.armed],
                      ["guardsUnarmed", t.unarmed],
                    ] as const
                  ).map(([key, label]) => (
                    <li key={key} className="flex items-center justify-between gap-4 p-4">
                      <span className="font-medium">{label}</span>
                      <Stepper
                        value={order[key]}
                        onChange={(n) => set(key, Math.max(0, Math.min(20, n)))}
                        label={label}
                        dict={dict}
                      />
                    </li>
                  ))}
                </ul>
              </Collapse>

              <Collapse open={guards > 0 || order.guardsSuggest}>
                <LanguagePicker
                  title={t.steps.agentLanguage}
                  value={order.agentLanguage}
                  onChange={(v) => set("agentLanguage", v)}
                  dict={dict}
                />
              </Collapse>
            </Step>

            {/* 04 · Logística */}
            <Step n="04" title={t.steps.logistics} hint={period ? t.periodHint : undefined}>
              <div className={`grid gap-4 ${period ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                <Field label={period ? t.startDate : t.date} id="field-date" error={errors.date}>
                  <input
                    type="date"
                    value={order.date}
                    onChange={(e) => set("date", e.target.value)}
                    className={inputClass(!!errors.date)}
                  />
                </Field>
                {period && (
                  <Field label={t.endDate}>
                    <input
                      type="date"
                      value={order.endDate}
                      min={order.date || undefined}
                      onChange={(e) => set("endDate", e.target.value)}
                      className={inputClass()}
                    />
                  </Field>
                )}
                <Field label={t.time}>
                  <input type="time" value={order.time} onChange={(e) => set("time", e.target.value)} className={inputClass()} />
                </Field>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

              <div className="mt-6">
                <p className="label mb-3">{t.intercity}</p>
                <YesNo value={order.intercity} onChange={(v) => set("intercity", v)} yes={t.yes} no={t.no} />
                <AnimatePresence initial={false}>
                  {order.intercity && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-5 border-l border-line-strong pl-4">
                        <div>
                          <p className="label mb-3">{t.tripNeeds}</p>
                          <div className="flex flex-wrap gap-2">
                            {tripNeeds.map((n) => (
                              <Chip key={n} active={order.tripNeeds.includes(n)} onClick={() => toggleTripNeed(n)}>
                                {t.needs[n]}
                              </Chip>
                            ))}
                          </div>
                        </div>
                        <Field label={t.tripDuration}>
                          <input
                            value={order.tripDuration}
                            onChange={(e) => set("tripDuration", e.target.value)}
                            placeholder={t.tripDurationPh}
                            className={inputClass()}
                          />
                        </Field>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6">
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

            {/* 05 · Ocasião */}
            <Step n="05" title={t.steps.context} hint={t.contextHint}>
              <p className="label mb-3">{t.event}</p>
              <YesNo value={order.event} onChange={(v) => set("event", v)} yes={t.yes} no={t.no} />
              <AnimatePresence initial={false}>
                {order.event && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-5 border-l border-line-strong pl-4">
                      <div>
                        <p className="label mb-3">{t.eventKind}</p>
                        <div className="flex flex-wrap gap-2">
                          {eventKinds.map((k) => (
                            <Chip
                              key={k}
                              active={order.eventKind === k}
                              onClick={() => set("eventKind", order.eventKind === k ? null : k)}
                            >
                              {t.eventKinds[k]}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      <Field label={t.eventName}>
                        <input
                          value={order.eventName}
                          onChange={(e) => set("eventName", e.target.value)}
                          placeholder={t.eventNamePh}
                          className={inputClass()}
                        />
                      </Field>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="label mb-3 mt-6">{t.exposure}</p>
              <div className="flex flex-wrap gap-2">
                {exposures.map((x) => (
                  <Chip key={x} active={order.exposure === x} onClick={() => set("exposure", order.exposure === x ? null : x)}>
                    {t.exposures[x]}
                  </Chip>
                ))}
              </div>
            </Step>

            {/* 06 · Contato */}
            <Step n="06" title={t.steps.contact}>
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
                {chosen.length > 0 ? <MessagePreview text={message} /> : <p className="text-sm text-muted">{t.empty}</p>}
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
                {chosen.length > 0 ? (
                  `${chosen[0].name}${chosen.length > 1 ? ` +${chosen.length - 1}` : ""}`
                ) : (
                  <span className="text-muted">{t.empty}</span>
                )}
                {(vehicles > 0 || guards > 0) && (
                  <span className="num block text-xs text-muted">
                    {vehicles > 0 && `${vehicles} ${dict.message.vehicles.toLowerCase()}`}
                    {vehicles > 0 && guards > 0 && " · "}
                    {guards > 0 && `${guards} ${dict.message.guards.toLowerCase()}`}
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

// Soma serviços sem repetir; o de eventos já marca "é para um evento?" (se ainda não respondido)
function withServices(order: Order, ids: string[]): Order {
  const services = [...order.services, ...ids.filter((id) => !order.services.includes(id))];
  const event = ids.includes("eventos") && order.event === null ? true : order.event;
  return { ...order, services, event };
}

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

// Sim / Não com "desmarcar" ao tocar de novo (pergunta é opcional)
function YesNo(props: { value: boolean | null; onChange: (v: boolean | null) => void; yes: string; no: string }) {
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
function SuggestToggle(props: { active: boolean; onClick: () => void; label: string; note: string }) {
  return (
    <div className="mb-4">
      <Chip active={props.active} onClick={props.onClick}>
        {props.label}
      </Chip>
      {props.active && <p className="mt-3 text-sm text-muted">{props.note}</p>}
    </div>
  );
}

function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
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

function CheckBox({ active }: { active: boolean }) {
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
function LanguagePicker(props: {
  title: string;
  value: LanguagePref;
  onChange: (v: LanguagePref) => void;
  dict: Dictionary;
}) {
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
              <span className="w-32 shrink-0 pt-0.5 text-[0.8125rem] text-muted">{match[1]}</span>
              <span className="min-w-0 break-words">{match[2]}</span>
            </p>
          );
        }
        return (
          <p key={i} className="pl-[calc(8rem+0.75rem)] break-words">
            {line.replace(/^• /, "")}
          </p>
        );
      })}
    </div>
  );
}
