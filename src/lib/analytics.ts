import { track } from "@vercel/analytics";

import { guardCount, vehicleCount, type Order } from "./order";

// Rastreio leve e sem dado pessoal: só o que foi pedido, nunca quem pediu.
// Vercel Analytics: fora da Vercel (GitHub Pages, dev) `track` não faz nada.

export function trackOrderSent(order: Order): void {
  try {
    track("whatsapp_send", {
      services: [...order.services].sort().join("+"),
      service_count: order.services.length,
      vehicles: order.vehiclesSuggest ? -1 : vehicleCount(order),
      guards: order.guardsSuggest ? -1 : guardCount(order),
      intercity: order.intercity === null ? "na" : order.intercity ? "yes" : "no",
      event: order.event === null ? "na" : order.event ? "yes" : "no",
      exposure: order.exposure ?? "na",
    });
  } catch {
    // analytics nunca pode quebrar o envio
  }
}
