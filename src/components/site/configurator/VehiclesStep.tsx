"use client";

import Image from "next/image";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale, SiteContent } from "@/lib/types";

import { Collapse, LanguagePicker, Stepper, SuggestToggle } from "./primitives";
import type { ConfiguratorState } from "./useConfigurator";

export function VehiclesStep({
  c,
  dict,
  content,
  locale,
}: {
  c: ConfiguratorState;
  dict: Dictionary;
  content: SiteContent;
  locale: Locale;
}) {
  const t = dict.order;
  return (
    <>
      <SuggestToggle active={c.order.vehiclesSuggest} onClick={c.toggleVehiclesSuggest} label={t.suggest} note={t.suggestNote} />
      <Collapse open={!c.order.vehiclesSuggest}>
        <ul className="divide-y divide-line border-y border-line">
          {content.vehicleCategories.map((v) => {
            const qty = c.order.vehicles[v.id] ?? 0;
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
                <Stepper value={qty} onChange={(n) => c.setVehicle(v.id, n)} label={v.name[locale]} dict={dict} />
              </li>
            );
          })}
        </ul>
      </Collapse>
      <Collapse open={c.vehicles > 0 || c.order.vehiclesSuggest}>
        <LanguagePicker title={t.steps.driver} value={c.order.driverLanguage} onChange={(v) => c.set("driverLanguage", v)} dict={dict} />
      </Collapse>
    </>
  );
}
