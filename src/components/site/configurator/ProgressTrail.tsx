"use client";

import type { Dictionary } from "@/i18n/dictionaries";

import { STEPS } from "./steps";
import type { ConfiguratorState } from "./useConfigurator";

// Trilha de progresso: segmentos clicáveis até onde já chegou
export function ProgressTrail({ c, dict }: { c: ConfiguratorState; dict: Dictionary }) {
  const t = dict.order;
  return (
    <nav aria-label={t.summary}>
      <ol className="flex gap-1.5">
        {STEPS.map((k, i) => {
          const done = i < c.step;
          const can = i <= c.reached;
          return (
            <li key={k} className="flex-1">
              <button
                type="button"
                disabled={!can}
                onClick={() => c.go(i)}
                aria-current={i === c.step ? "step" : undefined}
                aria-label={`${i + 1}. ${t.steps[k]}`}
                className="group block w-full py-2 disabled:cursor-default"
              >
                <span
                  className={`block h-1 rounded-full transition-colors duration-300 ${
                    i === c.step ? "bg-text" : done ? "bg-accent" : can ? "bg-line-strong group-hover:bg-silver" : "bg-line"
                  }`}
                />
                <span
                  className={`mt-2 hidden truncate text-left text-xs md:block ${i === c.step ? "text-text" : done ? "text-silver" : "text-muted"}`}
                >
                  {t.steps[k]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="num mt-1 text-xs text-muted md:hidden">
        {c.stepLabel} · <span className="text-text">{t.steps[c.key]}</span>
      </p>
    </nav>
  );
}
