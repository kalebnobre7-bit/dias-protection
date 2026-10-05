"use client";

import type { Dictionary } from "@/i18n/dictionaries";

import { CheckBox } from "./primitives";
import type { ConfiguratorState } from "./useConfigurator";

export function ServiceStep({ c, dict }: { c: ConfiguratorState; dict: Dictionary }) {
  const t = dict.order;
  return (
    <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label={t.steps.service}>
      {c.options.map((s) => {
        const active = c.order.services.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            role="checkbox"
            aria-checked={active}
            onClick={() => c.toggleService(s.id)}
            className={`rounded-2xl border p-4 text-left transition-[border-color,background-color,transform] duration-300 ease-[var(--ease-snap)] active:scale-[0.98] ${
              active ? "border-accent/60 bg-accent/[0.07]" : "border-line hover:border-line-strong"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-medium">{s.name}</span>
              <CheckBox active={active} />
            </span>
            <span className="mt-1.5 block text-[0.8125rem] leading-relaxed text-muted">{s.summary}</span>
          </button>
        );
      })}
      {c.errors.service && <p className="text-sm text-danger sm:col-span-2">{c.errors.service}</p>}
    </div>
  );
}
