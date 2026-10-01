import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale, SiteContent } from "./types";

export type Duration = "4h" | "8h" | "12h" | "multi";
export type DriverLanguage = "pt" | "en";
export type TripNeed = "vehicle" | "driver" | "guards";
export type EventKind = "sports" | "show" | "corporate" | "social" | "political" | "other";
export type Exposure = "no" | "public" | "pep";

export type Order = {
  serviceTypeId: string | null;
  vehicles: Record<string, number>; // id da categoria → quantidade
  vehiclesSuggest: boolean; // cliente não sabe: a equipe sugere
  guards: number;
  guardsSuggest: boolean;
  armed: boolean;
  driverLanguage: DriverLanguage;
  date: string; // yyyy-mm-dd
  time: string; // hh:mm
  duration: Duration | null;
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
  serviceTypeId: null,
  vehicles: {},
  vehiclesSuggest: false,
  guards: 0,
  guardsSuggest: false,
  armed: true,
  driverLanguage: "pt",
  date: "",
  time: "",
  duration: null,
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
  if (!order.serviceTypeId) errors.service = dict.order.errors.service;
  if (!order.date) errors.date = dict.order.errors.date;
  if (!order.name.trim()) errors.name = dict.order.errors.name;
  return errors;
}

export function vehicleCount(order: Order): number {
  return Object.values(order.vehicles).reduce((sum, n) => sum + n, 0);
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

  const service = content.serviceTypes.find((s) => s.id === order.serviceTypeId);
  add(m.service, service?.name[locale] ?? "");

  if (order.date) {
    const date = formatDate(order.date, locale);
    add(m.date, order.time ? `${date} ${m.at} ${order.time}` : date);
  }
  add(m.duration, order.duration ? dict.order.durations[order.duration] : "");
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
  const hasTeam = wantsVehicle || order.guards > 0 || order.guardsSuggest;

  if (hasTeam) lines.push("");
  if (order.vehiclesSuggest) add(m.vehicles, m.suggest);
  else if (vehicleLines.length > 0) lines.push(`*${m.vehicles}:*`, ...vehicleLines);
  if (wantsVehicle) add(m.driver, order.driverLanguage === "en" ? m.driverEn : m.driverPt);

  if (order.guardsSuggest) add(m.guards, m.suggest);
  else if (order.guards > 0) add(m.guards, `${order.guards} (${order.armed ? m.armed : m.unarmed})`);

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
