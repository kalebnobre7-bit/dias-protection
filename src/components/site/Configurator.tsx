"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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

// Um passo por tela; os opcionais podem ser pulados com "Próximo"
type StepKey = "service" | "vehicles" | "guards" | "logistics" | "context" | "contact" | "review";
const STEPS: StepKey[] = ["service", "vehicles", "guards", "logistics", "context", "contact", "review"];
const OPTIONAL = new Set<StepKey>(["vehicles", "guards", "context"]);
// Qual erro trava cada passo
const STEP_ERROR: Partial<Record<StepKey, keyof OrderErrors>> = { service: "service", logistics: "date", contact: "name" };

const languages: Language[] = ["pt", "pt-en", "pt-es", "other"];
const tripNeeds: TripNeed[] = ["vehicle", "driver", "guards"];
const eventKinds: EventKind[] = ["sports", "show", "corporate", "social", "political", "other"];
const exposures: Exposure[] = ["no", "public", "pep"];

const easeOut = [0.16, 1, 0.3, 1] as const;
const slide = {
  enter: (dir: number) => ({ x: dir * 32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -32, opacity: 0 }),
};

export function Configurator({ content, dict, locale }: Props) {
  const t = dict.order;
  const [order, setOrder] = useState<Order>(emptyOrder);
  const [errors, setErrors] = useState<OrderErrors>({});
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0); // até onde o cliente já chegou (pode voltar pela trilha)
  const [dir, setDir] = useState(1);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const key = STEPS[step];
  const last = step === STEPS.length - 1;

  const set = <K extends keyof Order>(k: K, value: Order[K]) => {
    setOrder((o) => ({ ...o, [k]: value }));
    if (k === "date" || k === "name") setErrors((e) => ({ ...e, [k]: undefined }));
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

  // Barra fixa do mobile só enquanto o configurador está na tela
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const options = useMemo(() => serviceOptions(content, dict, locale), [content, dict, locale]);
  const chosen = options.filter((o) => order.services.includes(o.id));
  const message = useMemo(() => buildMessage(order, content, dict, locale), [order, content, dict, locale]);
  const vehicles = vehicleCount(order);
  const guards = guardCount(order);
  const period = usesPeriod(order);

  // Valida só o que o passo atual exige
  function stepValid(k: StepKey): boolean {
    const field = STEP_ERROR[k];
    if (!field) return true;
    const found = validateOrder(order, dict);
    if (found[field]) {
      setErrors({ [field]: found[field] });
      return false;
    }
    return true;
  }

  function go(to: number) {
    if (to > step && !stepValid(key)) return;
    setDir(to > step ? 1 : -1);
    setStep(to);
    setReached((r) => Math.max(r, to));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function send() {
    const found = validateOrder(order, dict);
    const bad = (Object.keys(STEP_ERROR) as StepKey[]).find((k) => found[STEP_ERROR[k]!]);
    if (bad) {
      setErrors(found);
      setDir(-1);
      setStep(STEPS.indexOf(bad));
      return;
    }
    window.open(whatsappUrl(content.company.whatsapp, message), "_blank", "noopener");
  }

  const stepLabel = t.stepOf.replace("{n}", String(step + 1)).replace("{total}", String(STEPS.length));

  return (
    <section id="pedido" ref={sectionRef} className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-24 md:pt-10">
        <div ref={topRef} className="scroll-mt-24" />

        {/* Trilha de progresso: segmentos clicáveis até onde já chegou */}
        <nav aria-label={t.summary}>
          <ol className="flex gap-1.5">
            {STEPS.map((k, i) => {
              const done = i < step;
              const can = i <= reached;
              return (
                <li key={k} className="flex-1">
                  <button
                    type="button"
                    disabled={!can}
                    onClick={() => go(i)}
                    aria-current={i === step ? "step" : undefined}
                    aria-label={`${i + 1}. ${t.steps[k]}`}
                    className="group block w-full py-2 disabled:cursor-default"
                  >
                    <span
                      className={`block h-1 rounded-full transition-colors duration-300 ${
                        i === step ? "bg-text" : done ? "bg-accent" : can ? "bg-line-strong group-hover:bg-silver" : "bg-line"
                      }`}
                    />
                    <span
                      className={`mt-2 hidden truncate text-left text-xs md:block ${
                        i === step ? "text-text" : done ? "text-silver" : "text-muted"
                      }`}
                    >
                      {t.steps[k]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="num mt-1 text-xs text-muted md:hidden">
            {stepLabel} · <span className="text-text">{t.steps[key]}</span>
          </p>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-16">
          <form onSubmit={(e) => e.preventDefault()} noValidate className="min-w-0">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={key}
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: easeOut }}
              >
                <StepHeader
                  title={t.steps[key]}
                  hint={stepHint(key, t, period)}
                  tag={OPTIONAL.has(key) ? t.optional : undefined}
                />

                {key === "service" && (
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
                            active ? "border-accent/60 bg-accent/[0.07]" : "border-line hover:border-line-strong"
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
                    {errors.service && <p className="text-sm text-danger sm:col-span-2">{errors.service}</p>}
                  </div>
                )}

                {key === "vehicles" && (
                  <>
                    <SuggestToggle
                      active={order.vehiclesSuggest}
                      onClick={() => setOrder((o) => ({ ...o, vehiclesSuggest: !o.vehiclesSuggest, vehicles: {} }))}
                      label={t.suggest}
                      note={t.suggestNote}
                    />
                    <Collapse open={!order.vehiclesSuggest}>
                      <ul className="divide-y divide-line border-y border-line">
                        {content.vehicleCategories.map((v) => {
                          const qty = order.vehicles[v.id] ?? 0;
                          return (
                            <li key={v.id} className="flex items-center gap-3 py-3 sm:gap-4">
                              {v.image && (
                                <Image
                                  src={v.image}
                                  alt=""
                                  width={96}
                                  height={72}
                                  sizes="96px"
                                  className={`h-12 w-16 shrink-0 object-contain transition-transform duration-500 ease-[var(--ease-snap)] sm:h-14 sm:w-20 ${
                                    qty > 0 ? "scale-110" : ""
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
                              <Stepper value={qty} onChange={(n) => setVehicle(v.id, n)} label={v.name[locale]} dict={dict} />
                            </li>
                          );
                        })}
                      </ul>
                    </Collapse>
                    <Collapse open={vehicles > 0 || order.vehiclesSuggest}>
                      <LanguagePicker
                        title={t.steps.driver}
                        value={order.driverLanguage}
                        onChange={(v) => set("driverLanguage", v)}
                        dict={dict}
                      />
                    </Collapse>
                  </>
                )}

                {key === "guards" && (
                  <>
                    <SuggestToggle
                      active={order.guardsSuggest}
                      onClick={() =>
                        setOrder((o) => ({ ...o, guardsSuggest: !o.guardsSuggest, guardsArmed: 0, guardsUnarmed: 0 }))
                      }
                      label={t.suggest}
                      note={t.suggestNote}
                    />
                    <Collapse open={!order.guardsSuggest}>
                      <ul className="divide-y divide-line border-y border-line">
                        {(
                          [
                            ["guardsArmed", t.armed],
                            ["guardsUnarmed", t.unarmed],
                          ] as const
                        ).map(([k, label]) => (
                          <li key={k} className="flex items-center justify-between gap-4 py-3">
                            <span className="font-medium">{label}</span>
                            <Stepper value={order[k]} onChange={(n) => set(k, Math.max(0, Math.min(20, n)))} label={label} dict={dict} />
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
                  </>
                )}

                {key === "logistics" && (
                  <div className="space-y-6">
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
                    <div className="grid gap-4 sm:grid-cols-2">
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

                    <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
                      <div>
                        <p className="label mb-3">{t.intercity}</p>
                        <YesNo value={order.intercity} onChange={(v) => set("intercity", v)} yes={t.yes} no={t.no} />
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
                    <Collapse open={order.intercity === true}>
                      <div className="space-y-5 border-l-2 border-accent/40 pl-4">
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
                    </Collapse>
                  </div>
                )}

                {key === "context" && (
                  <div className="space-y-6">
                    <div>
                      <p className="label mb-3">{t.event}</p>
                      <YesNo value={order.event} onChange={(v) => set("event", v)} yes={t.yes} no={t.no} />
                    </div>
                    <Collapse open={order.event === true}>
                      <div className="space-y-5 border-l-2 border-accent/40 pl-4">
                        <div>
                          <p className="label mb-3">{t.eventKind}</p>
                          <div className="flex flex-wrap gap-2">
                            {eventKinds.map((k) => (
                              <Chip key={k} active={order.eventKind === k} onClick={() => set("eventKind", order.eventKind === k ? null : k)}>
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
                    </Collapse>
                    <div>
                      <p className="label mb-3">{t.exposure}</p>
                      <div className="flex flex-wrap gap-2">
                        {exposures.map((x) => (
                          <Chip key={x} active={order.exposure === x} onClick={() => set("exposure", order.exposure === x ? null : x)}>
                            {t.exposures[x]}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {key === "contact" && (
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
                )}

                {key === "review" && (
                  <div className="rounded-2xl border border-line p-5 md:p-6">
                    <MessagePreview text={message} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navegação no desktop (no mobile é a barra fixa) */}
            <div className="mt-10 hidden items-center justify-between gap-4 lg:flex">
              <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="btn btn-ghost disabled:invisible">
                <ArrowLeft className="size-4" aria-hidden />
                {t.back}
              </button>
              {last ? (
                <button type="button" onClick={send} className="btn btn-primary">
                  {t.send}
                </button>
              ) : (
                <button type="button" onClick={() => go(step + 1)} className="btn btn-primary">
                  {t.next}
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </form>

          {/* Resumo vivo (desktop) */}
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start" aria-live="polite">
            <p className="label">{t.summary}</p>
            <div className="mt-4 border-t border-line pt-4">
              {chosen.length > 0 ? <MessagePreview text={message} compact /> : <p className="text-sm text-muted">{t.empty}</p>}
            </div>
            <a
              href={whatsappUrl(content.company.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block border-t border-line pt-5 text-sm"
            >
              <span className="block font-medium">{t.asideTitle}</span>
              <span className="mt-1 block text-muted">
                {t.asideText} <span className="text-accent">›</span>
              </span>
            </a>
          </aside>
        </div>
      </div>

      {/* Barra fixa no mobile: voltar · passo atual · próximo */}
      <AnimatePresence>
        {inView && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/85 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-[16px] backdrop-saturate-[180%] lg:hidden"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => go(step - 1)}
                disabled={step === 0}
                aria-label={t.back}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-line disabled:opacity-30"
              >
                <ArrowLeft className="size-4" aria-hidden />
              </button>
              <p className="min-w-0 flex-1 text-sm">
                <span className="block truncate font-medium">
                  {chosen.length > 0 ? `${chosen[0].name}${chosen.length > 1 ? ` +${chosen.length - 1}` : ""}` : t.empty}
                </span>
                <span className="num block text-xs text-muted">
                  {vehicles > 0 && `${vehicles} ${dict.message.vehicles.toLowerCase()}`}
                  {vehicles > 0 && guards > 0 && " · "}
                  {guards > 0 && `${guards} ${dict.message.guards.toLowerCase()}`}
                  {vehicles === 0 && guards === 0 && stepLabel}
                </span>
              </p>
              {last ? (
                <button type="button" onClick={send} className="btn btn-primary shrink-0 !px-5 !text-[0.9375rem]">
                  {t.send}
                </button>
              ) : (
                <button type="button" onClick={() => go(step + 1)} className="btn btn-primary shrink-0 !px-5 !text-[0.9375rem]">
                  {t.next}
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ——— Peças internas ——— */

function stepHint(key: StepKey, t: Dictionary["order"], period: boolean): string | undefined {
  switch (key) {
    case "service":
      return t.serviceHint;
    case "vehicles":
      return t.vehiclesHint;
    case "guards":
      return t.guardsHint;
    case "logistics":
      return period ? t.periodHint : undefined;
    case "context":
      return t.contextHint;
    case "review":
      return t.reviewLead;
    default:
      return undefined;
  }
}

// Soma serviços sem repetir; o de eventos já marca "é para um evento?" (se ainda não respondido)
function withServices(order: Order, ids: string[]): Order {
  const services = [...order.services, ...ids.filter((id) => !order.services.includes(id))];
  const event = ids.includes("eventos") && order.event === null ? true : order.event;
  return { ...order, services, event };
}

function inputClass(invalid = false) {
  return `min-h-12 w-full rounded-xl border bg-ink-2 px-4 py-3 text-base placeholder:text-muted/60 transition-colors duration-300 focus:outline-none focus:border-accent ${
    invalid ? "border-danger" : "border-line hover:border-line-strong"
  }`;
}

function StepHeader(props: { title: string; hint?: string; tag?: string }) {
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
    <div className="mb-5">
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
function LanguagePicker(props: { title: string; value: LanguagePref; onChange: (v: LanguagePref) => void; dict: Dictionary }) {
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
      <button type="button" className={btn} onClick={() => props.onChange(props.value + 1)} aria-label={`${props.dict.order.increase}: ${props.label}`}>
        +
      </button>
    </div>
  );
}

// Renderiza "*Rótulo:* valor" como linhas do resumo; pula o título
function MessagePreview({ text, compact = false }: { text: string; compact?: boolean }) {
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
