"use client";

import type { Dictionary } from "@/i18n/dictionaries";

import { Field, inputClass } from "./primitives";
import type { ConfiguratorState } from "./useConfigurator";

export function ContactStep({ c, dict }: { c: ConfiguratorState; dict: Dictionary }) {
  const t = dict.order;
  const { order, errors, set } = c;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t.name} id="field-name" error={errors.name}>
        <input
          value={order.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder={t.namePh}
          autoComplete="name"
          className={inputClass(!!errors.name)}
        />
      </Field>
      <Field label={t.company}>
        <input
          value={order.company}
          onChange={(e) => set("company", e.target.value)}
          placeholder={t.companyPh}
          autoComplete="organization"
          className={inputClass()}
        />
      </Field>
      <Field label={t.notes} className="sm:col-span-2">
        <textarea
          value={order.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={t.notesPh}
          rows={3}
          className={`${inputClass()} resize-none`}
        />
      </Field>
    </div>
  );
}
