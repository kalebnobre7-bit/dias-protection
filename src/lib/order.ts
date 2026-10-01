import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale, SiteContent } from "./types";

export type Language = "pt" | "pt-en" | "pt-es" | "other";
export type LanguagePref = { choice: Language; other: string }; // other: idioma digitado
export type TripNeed = "vehicle" | "driver" | "guards";
export type EventKind = "sports" | "show" | "corporate" | "social" | "political" | "other";
export type Exposure = "no" | "public" | "pep";

// O transporte executivo aparece no pedido como duas opções: transfer (A → B) e diária
export const TRANSPORT_ID = "transporte-executivo";
export const TRANSFER = "transfer";
export const DAILY = "diaria";

export type ServiceOption = { id: string; name: string; summary: string };

export function serviceOptions(content: SiteContent, dict: Dictionary, locale: Locale): ServiceOption[] {
  return content.serviceTypes.flatMap((s) =>
    s.id === TRANSPORT_ID
      ? [
          { id: TRANSFER, ...dict.order.transfer },
          { id: DAILY, ...dict.order.daily },
        ]
      : [{ id: s.id, name: s.name[locale], summary: s.summary[locale] }],
  );
}

// ?servico=slug da página de serviços → opção(ões) do pedido
export function optionsForService(serviceId: string): string[] {
  return serviceId === TRANSPORT_ID ? [TRANSFER] : [serviceId];
}

export type Order = {
  services: string[]; // ids de ServiceOption (pode escolher vários)
  vehicles: Record<string, number>; // id da categoria → quantidade
  vehiclesSuggest: boolean; // cliente não sabe: a equipe sugere
  driverLanguage: LanguagePref;
  guardsArmed: number;
  guardsUnarmed: number;
  guardsSuggest: boolean;
  agentLanguage: LanguagePref;
  date: string; // yyyy-mm-dd (data do transfer ou início do período)
  time: string; // hh:mm
  endDate: string; // fim estimado do período (diária e demais serviços)
  origin: string;
  destination: string;
  passengers: number; // estimativa
  intercity: boolean | null; // null = não respondeu
  tripNeeds: TripNeed[];
  tripDuration: string;
  event: boolean | null;
  eventKind: EventKind | null;
  eventName: string;
  exposure: Exposure | null;
  name: string;
  company: string;
  notes: string;
};

export const emptyOrder: Order = {
  services: [],
  vehicles: {},
  vehiclesSuggest: false,
  driverLanguage: { choice: "pt", other: "" },
  guardsArmed: 0,
  guardsUnarmed: 0,
  guardsSuggest: false,
  agentLanguage: { choice: "pt", other: "" },
  date: "",
  time: "",
  endDate: "",
  origin: "",
  destination: "",
  passengers: 1,
  intercity: null,
  tripNeeds: [],
  tripDuration: "",
  event: null,
  eventKind: null,
  eventName: "",
  exposure: null,
  name: "",
  company: "",
  notes: "",
};

export type OrderErrors = Partial<Record<"service" | "date" | "name", string>>;

export function validateOrder(order: Order, dict: Dictionary): OrderErrors {
  const errors: OrderErrors = {};
  if (order.services.length === 0) errors.service = dict.order.errors.service;
  if (!order.date) errors.date = dict.order.errors.date;
  if (!order.name.trim()) errors.name = dict.order.errors.name;
  return errors;
}

export function vehicleCount(order: Order): number {
  return Object.values(order.vehicles).reduce((sum, n) => sum + n, 0);
}

export function guardCount(order: Order): number {
  return order.guardsArmed + order.guardsUnarmed;
}

// Período (início → fim) só não faz sentido quando o pedido é apenas transfer
export function usesPeriod(order: Order): boolean {
  return order.services.some((id) => id !== TRANSFER);
}

function languageText(pref: LanguagePref, dict: Dictionary): string {
  if (pref.choice !== "other") return dict.message.languages[pref.choice];
  return pref.other.trim() ? `${dict.message.languages.pt} + ${pref.other.trim()}` : dict.message.languages.other;
}

function formatDate(date: string, locale: Locale): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: locale === "pt" ? "2-digit" : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

// Monta o texto do WhatsApp (negrito com *…*) só com os campos preenchidos
export function buildMessage(
  order: Order,
  content: SiteContent,
  dict: Dictionary,
  locale: Locale,
): string {
  const m = dict.message;
  const lines: string[] = [`*${m.title}*`, ""];
  const add = (label: string, value: string) => value && lines.push(`*${label}:* ${value}`);

  const options = serviceOptions(content, dict, locale);
  const chosen = options.filter((o) => order.services.includes(o.id)).map((o) => o.name);
  if (chosen.length === 1) add(m.service, chosen[0]);
  else if (chosen.length > 1) lines.push(`*${m.services}:*`, ...chosen.map((n) => `• ${n}`));

  if (order.date) {
    const start = formatDate(order.date, locale);
    const startAt = order.time ? `${start} ${m.at} ${order.time}` : start;
    if (usesPeriod(order) && order.endDate) add(m.period, `${startAt} ${m.until} ${formatDate(order.endDate, locale)}`);
    else add(m.date, startAt);
  }
  add(m.origin, order.origin.trim());
  add(m.destination, order.destination.trim());
  add(m.passengers, String(order.passengers));

  if (order.intercity !== null) {
    add(m.intercity, order.intercity ? m.yes : m.no);
    if (order.intercity) {
      const list = new Intl.ListFormat(locale === "pt" ? "pt-BR" : "en-US", { type: "conjunction" });
      add(m.tripNeeds, list.format(order.tripNeeds.map((n) => m.needs[n])));
      add(m.tripDuration, order.tripDuration.trim());
    }
  }
  if (order.event) {
    const kind = order.eventKind ? dict.order.eventKinds[order.eventKind] : "";
    add(m.event, [kind, order.eventName.trim()].filter(Boolean).join(" · ") || m.yes);
  }
  add(m.exposure, order.exposure ? m.exposures[order.exposure] : "");

  const vehicleLines = order.vehiclesSuggest
    ? []
    : content.vehicleCategories
        .filter((v) => (order.vehicles[v.id] ?? 0) > 0)
        .map((v) => `• ${order.vehicles[v.id]}× ${v.name[locale]}`);
  const wantsVehicle = vehicleLines.length > 0 || order.vehiclesSuggest;
  const guards = guardCount(order);
  const wantsGuards = guards > 0 || order.guardsSuggest;
  const hasTeam = wantsVehicle || wantsGuards;

  if (hasTeam) lines.push("");
  if (order.vehiclesSuggest) add(m.vehicles, m.suggest);
  else if (vehicleLines.length > 0) lines.push(`*${m.vehicles}:*`, ...vehicleLines);
  if (wantsVehicle) add(m.driverLanguage, languageText(order.driverLanguage, dict));

  if (order.guardsSuggest) add(m.guards, m.suggest);
  else if (guards > 0) {
    const parts = [
      order.guardsArmed > 0 && `${order.guardsArmed} ${order.guardsArmed === 1 ? m.armedOne : m.armed}`,
      order.guardsUnarmed > 0 && `${order.guardsUnarmed} ${order.guardsUnarmed === 1 ? m.unarmedOne : m.unarmed}`,
    ].filter(Boolean);
    add(m.guards, parts.join(" + "));
  }
  if (wantsGuards) add(m.agentLanguage, languageText(order.agentLanguage, dict));

  lines.push("");
  const company = order.company.trim();
  add(m.contact, company ? `${order.name.trim()} · ${company}` : order.name.trim());
  add(m.notes, order.notes.trim());

  return lines.join("\n");
}

export function whatsappUrl(phone: string, text?: string): string {
  const base = `https://wa.me/${phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
