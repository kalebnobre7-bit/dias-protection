"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { EventKind, Exposure } from "@/lib/order";

import { Chip, Collapse, Field, inputClass, YesNo } from "./primitives";
import type { ConfiguratorState } from "./useConfigurator";

const eventKinds: EventKind[] = ["sports", "show", "corporate", "social", "political", "other"];
const exposures: Exposure[] = ["no", "public", "pep"];

export function ContextStep({ c, dict }: { c: ConfiguratorState; dict: Dictionary }) {
  const t = dict.order;
  const { order, set } = c;
  return (
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
  );
}
