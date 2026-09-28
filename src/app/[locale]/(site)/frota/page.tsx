import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, Stagger, StaggerItem } from "@/components/site/Reveal";
import { loadPage, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await loadPage(params);
  return { title: `${dict.meta.pages.fleet} · Dias Protection`, description: dict.fleet.lead };
}

export default async function FleetPage({ params }: LocaleParams) {
  const { locale, dict, content } = await loadPage(params);
  const t = dict.fleet;
  const transport = content.serviceTypes.find((s) => s.id === "transporte-executivo");

  return (
    <>
      <PageHero label={t.label} title={t.title} lead={t.lead} image="/images/convoy.jpg" />

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <Stagger as="ul" className="grid gap-4 sm:grid-cols-2">
          {content.vehicleCategories.map((v) => (
            <StaggerItem as="li" key={v.id} className="tile lift flex flex-col gap-10 p-7 md:p-10">
              <div className="flex items-start justify-between gap-4">
                <h2 className="t-h3 !text-[clamp(1.5rem,2.4vw,2rem)]">{v.name[locale]}</h2>
                {v.armored && (
                  <span className="shrink-0 rounded-full border border-accent/40 px-3 py-1 text-xs font-semibold text-accent">
                    {t.armored}
                  </span>
                )}
              </div>
              <p className="text-muted">{v.description[locale]}</p>
              <p className="mt-auto flex items-baseline gap-2 border-t border-line pt-5 text-[0.9375rem] text-muted">
                <span className="t-stat !text-[2.5rem] text-text">{v.capacity}</span> {t.seats}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Motorista bilíngue: destaque com imagem */}
      <section className="bg-ink-2">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-28 md:grid-cols-2 md:items-center md:gap-20 md:px-8 md:py-40">
          <Reveal>
            <div className="tile relative aspect-[16/10]">
              <Image src="/images/driver.jpg" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            {transport && (
              <>
                <h2 className="t-h2">{transport.name[locale]}</h2>
                <p className="mt-5 max-w-[52ch] text-muted">{transport.description[locale]}</p>
                <Link href={`/${locale}/servicos/${transport.id}`} className="link-chevron mt-8 min-h-11">
                  {dict.common.learnMore}
                </Link>
              </>
            )}
          </Reveal>
        </div>
      </section>

      <CtaBand dict={dict} locale={locale} whatsapp={content.company.whatsapp} />
    </>
  );
}
