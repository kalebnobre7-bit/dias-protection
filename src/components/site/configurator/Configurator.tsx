"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";
import { whatsappUrl } from "@/lib/order";
import type { Locale, SiteContent } from "@/lib/types";

import { ContactStep } from "./ContactStep";
import { ContextStep } from "./ContextStep";
import { GuardsStep } from "./GuardsStep";
import { LogisticsStep } from "./LogisticsStep";
import { MobileBar } from "./MobileBar";
import { MessagePreview, StepHeader } from "./primitives";
import { ProgressTrail } from "./ProgressTrail";
import { ServiceStep } from "./ServiceStep";
import { OPTIONAL, stepHint } from "./steps";
import { useConfigurator } from "./useConfigurator";
import { VehiclesStep } from "./VehiclesStep";

type Props = { content: SiteContent; dict: Dictionary; locale: Locale };

const easeOut = [0.16, 1, 0.3, 1] as const;
const slide = {
  enter: (dir: number) => ({ x: dir * 32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -32, opacity: 0 }),
};

// Casco do configurador: trilha, passo atual (um componente por passo), navegação e resumo.
// O estado inteiro vive em useConfigurator().
export function Configurator({ content, dict, locale }: Props) {
  const t = dict.order;
  const c = useConfigurator(content, dict, locale);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  // Barra fixa do mobile só enquanto o configurador está na tela
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Ao trocar de passo, volta para o topo do formulário (não no primeiro render)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [c.step]);

  return (
    <section id="pedido" ref={sectionRef} className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-24 md:pt-10">
        <div ref={topRef} className="scroll-mt-24" />

        <ProgressTrail c={c} dict={dict} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-16">
          <form onSubmit={(e) => e.preventDefault()} noValidate className="min-w-0">
            <AnimatePresence mode="wait" initial={false} custom={c.dir}>
              <motion.div
                key={c.key}
                custom={c.dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: easeOut }}
              >
                <StepHeader title={t.steps[c.key]} hint={stepHint(c.key, t, c.period)} tag={OPTIONAL.has(c.key) ? t.optional : undefined} />

                {c.key === "service" && <ServiceStep c={c} dict={dict} />}
                {c.key === "vehicles" && <VehiclesStep c={c} dict={dict} content={content} locale={locale} />}
                {c.key === "guards" && <GuardsStep c={c} dict={dict} />}
                {c.key === "logistics" && <LogisticsStep c={c} dict={dict} />}
                {c.key === "context" && <ContextStep c={c} dict={dict} />}
                {c.key === "contact" && <ContactStep c={c} dict={dict} />}
                {c.key === "review" && (
                  <div className="rounded-2xl border border-line p-5 md:p-6">
                    <MessagePreview text={c.message} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navegação no desktop (no mobile é a barra fixa) */}
            <div className="mt-10 hidden items-center justify-between gap-4 lg:flex">
              <button type="button" onClick={() => c.go(c.step - 1)} disabled={c.step === 0} className="btn btn-ghost disabled:invisible">
                <ArrowLeft className="size-4" aria-hidden />
                {t.back}
              </button>
              {c.last ? (
                <button type="button" onClick={c.send} className="btn btn-primary">
                  {t.send}
                </button>
              ) : (
                <button type="button" onClick={() => c.go(c.step + 1)} className="btn btn-primary">
                  {t.next}
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </form>

          {/* Resumo vivo (desktop) */}
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start" aria-live="polite">
            <p className="label">{t.summary}</p>
            <div className="mt-4 border-t border-line pt-4">
              {c.chosen.length > 0 ? <MessagePreview text={c.message} compact /> : <p className="text-sm text-muted">{t.empty}</p>}
            </div>
            <a
              href={whatsappUrl(content.company.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block border-t border-line pt-5 text-sm"
            >
              <span className="block font-medium">{t.asideTitle}</span>
              <span className="mt-1 block text-muted">
                {t.asideText} <span className="text-accent">›</span>
              </span>
            </a>
          </aside>
        </div>
      </div>

      <MobileBar c={c} dict={dict} visible={inView} />
    </section>
  );
}
