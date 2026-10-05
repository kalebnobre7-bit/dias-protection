"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import type { Dictionary } from "@/i18n/dictionaries";

import type { ConfiguratorState } from "./useConfigurator";

// Barra fixa no celular: voltar · passo atual · próximo. Só aparece com o configurador na tela.
export function MobileBar({ c, dict, visible }: { c: ConfiguratorState; dict: Dictionary; visible: boolean }) {
  const t = dict.order;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/85 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-[16px] backdrop-saturate-[180%] lg:hidden"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => c.go(c.step - 1)}
              disabled={c.step === 0}
              aria-label={t.back}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line disabled:opacity-30"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </button>
            <p className="min-w-0 flex-1 text-sm">
              <span className="block truncate font-medium">
                {c.chosen.length > 0 ? `${c.chosen[0].name}${c.chosen.length > 1 ? ` +${c.chosen.length - 1}` : ""}` : t.empty}
              </span>
              <span className="num block text-xs text-muted">
                {c.vehicles > 0 && `${c.vehicles} ${dict.message.vehicles.toLowerCase()}`}
                {c.vehicles > 0 && c.guards > 0 && " · "}
                {c.guards > 0 && `${c.guards} ${dict.message.guards.toLowerCase()}`}
                {c.vehicles === 0 && c.guards === 0 && c.stepLabel}
              </span>
            </p>
            {c.last ? (
              <button type="button" onClick={c.send} className="btn btn-primary shrink-0 !px-5 !text-[0.9375rem]">
                {t.send}
              </button>
            ) : (
              <button type="button" onClick={() => c.go(c.step + 1)} className="btn btn-primary shrink-0 !px-5 !text-[0.9375rem]">
                {t.next}
                <ArrowRight className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
