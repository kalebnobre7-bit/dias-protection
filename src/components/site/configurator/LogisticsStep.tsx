"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { TripNeed } from "@/lib/order";

import { Chip, Collapse, Field, inputClass, Stepper, YesNo } from "./primitives";
import type { ConfiguratorState } from "./useConfigurator";

const tripNeeds: TripNeed[] = ["vehicle", "driver", "guards"];

export function LogisticsStep({ c, dict }: { c: ConfiguratorState; dict: Dictionary }) {
  const t = dict.order;
  const { order, errors, period, set } = c;
  return (
    <div className="space-y-6">
      <div className={`grid gap-4 ${period ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <Field label={period ? t.startDate : t.date} id="field-date" error={errors.date}>
          <input type="date" value={order.date} onChange={(e) => set("date", e.target.value)} className={inputClass(!!errors.date)} />
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
                <Chip key={n} active={order.tripNeeds.includes(n)} onClick={() => c.toggleTripNeed(n)}>
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
  );
}
