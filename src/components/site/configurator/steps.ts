import type { Dictionary } from "@/i18n/dictionaries";
import { type Order, type OrderErrors } from "@/lib/order";

// Um passo por tela; os opcionais podem ser pulados com "Próximo"
export type StepKey = "service" | "vehicles" | "guards" | "logistics" | "context" | "contact" | "review";

export const STEPS: StepKey[] = ["service", "vehicles", "guards", "logistics", "context", "contact", "review"];
export const OPTIONAL = new Set<StepKey>(["vehicles", "guards", "context"]);

// Qual erro trava cada passo
export const STEP_ERROR: Partial<Record<StepKey, keyof OrderErrors>> = { service: "service", logistics: "date", contact: "name" };

export function stepHint(key: StepKey, t: Dictionary["order"], period: boolean): string | undefined {
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
export function withServices(order: Order, ids: string[]): Order {
  const services = [...order.services, ...ids.filter((id) => !order.services.includes(id))];
  const event = ids.includes("eventos") && order.event === null ? true : order.event;
  return { ...order, services, event };
}

// Primeiro passo com erro, na ordem da trilha (para onde voltar ao enviar)
export function firstInvalidStep(errors: OrderErrors): StepKey | undefined {
  return STEPS.find((k) => {
    const field = STEP_ERROR[k];
    return field ? Boolean(errors[field]) : false;
  });
}
