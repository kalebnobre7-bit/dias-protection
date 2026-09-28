import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale, SiteContent } from "./types";

export type Duration = "4h" | "8h" | "12h" | "multi";
export type DriverLanguage = "pt" | "en";

export type Order = {
  serviceTypeId: string | null;
  vehicles: Record<string, number>; // id da categoria → quantidade
  guards: number;
  armed: boolean;
  driverLanguage: DriverLanguage;
  date: string; // yyyy-mm-dd
  time: string; // hh:mm
  duration: Duration | null;
  origin: string;
  destination: string;
  passengers: number;
  name: string;
  company: string;
  notes: string;
};

export const emptyOrder: Order = {
  serviceTypeId: null,
  vehicles: {},
  guards: 0,
  armed: true,
  driverLanguage: "pt",
  date: "",
  time: "",
  duration: null,
  origin: "",
  destination: "",
  passengers: 1,
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

  const vehicleLines = content.vehicleCategories
    .filter((v) => (order.vehicles[v.id] ?? 0) > 0)
    .map((v) => `• ${order.vehicles[v.id]}× ${v.name[locale]}`);
  const hasTeam = vehicleLines.length > 0 || order.guards > 0;

  if (hasTeam) lines.push("");
  if (vehicleLines.length > 0) {
    lines.push(`*${m.vehicles}:*`, ...vehicleLines);
    add(m.driver, order.driverLanguage === "en" ? m.driverEn : m.driverPt);
  }
  if (order.guards > 0) {
    add(m.guards, `${order.guards} (${order.armed ? m.armed : m.unarmed})`);
  }

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
