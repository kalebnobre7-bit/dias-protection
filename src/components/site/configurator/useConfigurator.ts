"use client";

import { useEffect, useMemo, useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";
import { trackOrderSent } from "@/lib/analytics";
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
  type Order,
  type OrderErrors,
  type TripNeed,
} from "@/lib/order";
import type { Locale, SiteContent } from "@/lib/types";

import { firstInvalidStep, STEP_ERROR, STEPS, withServices, type StepKey } from "./steps";

// Todo o estado do configurador: pedido, erros, passo atual e navegação.
// Os componentes de passo só recebem `order`, `errors` e as ações daqui.

export function useConfigurator(content: SiteContent, dict: Dictionary, locale: Locale) {
  const [order, setOrder] = useState<Order>(emptyOrder);
  const [errors, setErrors] = useState<OrderErrors>({});
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0); // até onde o cliente já chegou (pode voltar pela trilha)
  const [dir, setDir] = useState(1);

  const key: StepKey = STEPS[step];
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
    setOrder((o) => (o.services.includes(id) ? { ...o, services: o.services.filter((s) => s !== id) } : withServices(o, [id])));
    setErrors((e) => ({ ...e, service: undefined }));
  };

  const toggleVehiclesSuggest = () => setOrder((o) => ({ ...o, vehiclesSuggest: !o.vehiclesSuggest, vehicles: {} }));
  const toggleGuardsSuggest = () => setOrder((o) => ({ ...o, guardsSuggest: !o.guardsSuggest, guardsArmed: 0, guardsUnarmed: 0 }));

  // Pré-seleciona o serviço vindo da lista (?servico=id)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("servico");
    if (id && content.serviceTypes.some((s) => s.id === id)) setOrder((o) => withServices(o, optionsForService(id)));
  }, [content.serviceTypes]);

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
    if (to < 0 || to >= STEPS.length) return;
    if (to > step && !stepValid(key)) return;
    setDir(to > step ? 1 : -1);
    setStep(to);
    setReached((r) => Math.max(r, to));
  }

  function send() {
    const found = validateOrder(order, dict);
    const bad = firstInvalidStep(found);
    if (bad) {
      setErrors(found);
      setDir(-1);
      setStep(STEPS.indexOf(bad));
      return;
    }
    trackOrderSent(order);
    window.open(whatsappUrl(content.company.whatsapp, message), "_blank", "noopener");
  }

  const stepLabel = dict.order.stepOf.replace("{n}", String(step + 1)).replace("{total}", String(STEPS.length));

  return {
    order,
    errors,
    step,
    key,
    last,
    reached,
    dir,
    stepLabel,
    options,
    chosen,
    message,
    vehicles,
    guards,
    period,
    set,
    setVehicle,
    toggleTripNeed,
    toggleService,
    toggleVehiclesSuggest,
    toggleGuardsSuggest,
    go,
    send,
  };
}

export type ConfiguratorState = ReturnType<typeof useConfigurator>;
