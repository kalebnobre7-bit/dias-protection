import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, Stagger, StaggerItem } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { pageMetadata } from "@/lib/seo";
import { loadPage, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale, dict } = await loadPage(params);
  return pageMetadata({
    locale,
    path: "/frota",
    title: `${dict.meta.pages.fleet} · Dias Protection`,
    description: dict.fleet.lead,
  });
}

export default async function FleetPage({ params }: LocaleParams) {
  const { locale, dict, content } = await loadPage(params);
  const t = dict.fleet;
  const transport = content.serviceTypes.find((s) => s.id === "transporte-executivo");

  return (
    <>
      <PageHero label={t.label} title={t.title} lead={t.lead} image="/images/convoy.jpg" />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <Stagger as="ul" className="grid gap-4 sm:grid-cols-2">
          {content.vehicleCategories.map((v) => (
            <StaggerItem as="li" key={v.id} className="tile lift flex flex-col gap-10 p-7 md:p-10">
              {v.image && (
                <div className="relative -mx-2 aspect-[16/9]">
                  {/* sombra de chão: o carro "pousa" no card */}
                  <div aria-hidden className="absolute inset-x-[18%] bottom-[6%] h-[12%] rounded-[50%] bg-black/60 blur-xl" />
                  <Image
                    src={v.image}
                    alt={v.name[locale]}
                    fill
                    sizes="(min-width: 640px) 40vw, 90vw"
                    className="object-contain drop-shadow-[0_20px_30px_rgb(0_0_0/0.45)]"
                  />
                </div>
              )}
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

      {/* Veículos publicados pelo painel: foto e detalhes, nunca a placa */}
      {content.vehicles.length > 0 && (
        <section className="bg-ink-2">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
            <Reveal>
              <SectionHeading label={t.ourFleetLabel} title={t.ourFleetTitle} />
            </Reveal>
            <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.vehicles.map((v) => {
                const category = content.vehicleCategories.find((c) => c.id === v.categoryId);
                return (
                  <StaggerItem as="li" key={v.id} className="tile lift flex h-full flex-col">
                    <div className="relative aspect-[16/10] bg-[linear-gradient(180deg,var(--color-navy-2),var(--color-ink))]">
                      {v.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.photoUrl} alt={v.model} className="absolute inset-0 size-full object-cover" />
                      ) : category?.image ? (
                        <Image src={category.image} alt={v.model} fill sizes="(min-width: 640px) 40vw, 90vw" className="object-contain p-8" />
                      ) : null}
                      {v.armored && (
                        <span className="absolute left-4 top-4 rounded-full border border-accent/40 bg-ink/70 px-3 py-1 text-xs font-semibold text-accent backdrop-blur">
                          {t.armored}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="t-h3">
                        {v.model}
                        {v.year && <span className="num ml-2 text-base font-normal text-muted">{v.year}</span>}
                      </h3>
                      <p className="mt-1 text-[0.9375rem] text-muted">
                        {[category?.name[locale], v.color, v.capacity ? `${v.capacity} ${t.seats}` : null].filter(Boolean).join(" · ")}
                      </p>
                      {v.description[locale] && <p className="mt-3 text-[0.9375rem] leading-relaxed text-text/80">{v.description[locale]}</p>}
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </section>
      )}

      {/* Motorista bilíngue: destaque com imagem */}
      <section className="bg-ink-2">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:gap-20 md:px-8 md:py-28">
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
