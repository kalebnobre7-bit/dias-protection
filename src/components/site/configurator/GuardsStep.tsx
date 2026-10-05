"use client";

import type { Dictionary } from "@/i18n/dictionaries";

import { Collapse, LanguagePicker, Stepper, SuggestToggle } from "./primitives";
import type { ConfiguratorState } from "./useConfigurator";

export function GuardsStep({ c, dict }: { c: ConfiguratorState; dict: Dictionary }) {
  const t = dict.order;
  const rows = [
    ["guardsArmed", t.armed],
    ["guardsUnarmed", t.unarmed],
  ] as const;
  return (
    <>
      <SuggestToggle active={c.order.guardsSuggest} onClick={c.toggleGuardsSuggest} label={t.suggest} note={t.suggestNote} />
      <Collapse open={!c.order.guardsSuggest}>
        <ul className="divide-y divide-line border-y border-line">
          {rows.map(([k, label]) => (
            <li key={k} className="flex items-center justify-between gap-4 py-3">
              <span className="font-medium">{label}</span>
              <Stepper value={c.order[k]} onChange={(n) => c.set(k, Math.max(0, Math.min(20, n)))} label={label} dict={dict} />
            </li>
          ))}
        </ul>
      </Collapse>
      <Collapse open={c.guards > 0 || c.order.guardsSuggest}>
        <LanguagePicker
          title={t.steps.agentLanguage}
          value={c.order.agentLanguage}
          onChange={(v) => c.set("agentLanguage", v)}
          dict={dict}
        />
      </Collapse>
    </>
  );
}
