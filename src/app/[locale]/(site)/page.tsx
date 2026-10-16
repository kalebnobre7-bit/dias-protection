import { Check } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CompanyLogos } from "@/components/site/CompanyLogos";
import { CtaBand } from "@/components/site/CtaBand";
import { ParallaxBreak } from "@/components/site/ParallaxBreak";
import { HeroIn, Reveal, Stagger, StaggerItem } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ServiceCard } from "@/components/site/ServiceCard";
import { whatsappUrl } from "@/lib/order";
import { loadPage, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale, dict } = await loadPage(params);
  return pageMetadata({ locale, path: "", title: dict.meta.title, description: dict.meta.description });
}

// Largura de cada card no carrossel do celular; some do sm pra cima
const slideClass = "w-[78vw] max-w-[20rem] shrink-0 snap-start sm:w-auto sm:max-w-none";

export default async function Home({ params }: LocaleParams) {
  const { locale, dict, content } = await loadPage(params);
  const { company, founder, serviceTypes } = content;
  const [featured, ...others] = serviceTypes;
  const t = dict.home;

  return (
    <>
      {/* Hero: imagem em tela cheia, um CTA principal */}
      {/* Celular: hero mais curta e texto no centro; desktop: tela cheia com texto embaixo */}
      <section className="relative isolate flex min-h-[85svh] items-center overflow-hidden md:min-h-[min(100dvh,60rem)] md:items-end">
        <Image
          src="/images/hero-suv.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[82%_center] md:object-center"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/80 to-transparent" />

        <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-24 text-center md:px-8 md:pb-28 md:pt-32 md:text-left">
          <HeroIn>
            <p className="label !text-silver">{t.eyebrow}</p>
            <h1 className="t-hero mx-auto mt-5 max-w-[13ch] md:mx-0">{t.title}</h1>
          </HeroIn>
          <HeroIn delay={0.1}>
            <p className="t-lead mx-auto mt-7 max-w-[48ch] !text-text/80 md:mx-0">{t.lead}</p>
          </HeroIn>
          <HeroIn delay={0.2} className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8 md:justify-start">
            <Link href={`/${locale}/solicitar`} className="btn btn-primary">
              {dict.common.requestCta}
            </Link>
            <a
              href={whatsappUrl(company.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="link-chevron min-h-11"
            >
              {dict.common.whatsappCta}
            </a>
          </HeroIn>
        </div>
      </section>

      {/* Barra de números */}
      <section className="border-y border-line bg-ink-2">
        <Stagger as="dl" className="mx-auto grid max-w-7xl gap-px bg-line sm:grid-cols-2">
          {founder.stats.map((s) => (
            <StaggerItem key={s.label.pt} className="bg-ink-2 px-4 py-8 text-center md:px-8 md:py-10 md:text-left">
              <dt className="sr-only">{s.label[locale]}</dt>
              <dd>
                <span className="t-stat block">{s.value}</span>
                <span className="mx-auto mt-3 block max-w-[44ch] text-[0.9375rem] leading-snug text-muted md:mx-0">{s.label[locale]}</span>
              </dd>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Intro */}
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-20 md:px-8 md:py-28">
        <Reveal>
          <SectionHeading label={t.introLabel} title={t.introTitle} />
          <p className="mx-auto max-w-[58ch] text-center text-text/85 md:mx-0 md:text-left">{company.about[locale]}</p>
          <Stagger as="ol" className="mt-12 border-t border-line">
            {t.pillars.map((p, i) => (
              <StaggerItem as="li" key={p.title} className="grid grid-cols-[2.5rem_1fr] gap-2 border-b border-line py-5">
                <span className="num pt-0.5 text-[0.9375rem] font-semibold text-muted">{i + 1}</span>
                <div>
                  <p className="font-semibold tracking-[-0.015em]">{p.title}</p>
                  <p className="mt-1 text-[0.9375rem] text-muted">{p.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>
        <Reveal delay={0.1} className="hidden md:block">
          <figure className="tile relative aspect-[4/5]">
            <Image src="/images/hotel.jpg" alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
          </figure>
        </Reveal>
      </section>

      {/* Serviços: bento com uma célula dominante */}
      <section className="bg-ink-2">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-28">
          <Reveal>
            <SectionHeading label={t.servicesLabel} title={t.servicesTitle} />
          </Reveal>
          {/* Celular: carrossel com snap (uma tela, não cinco). Tablet+: grid com célula dominante */}
          <Stagger
            as="ul"
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scroll-px-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3"
          >
            <StaggerItem as="li" className={`${slideClass} sm:col-span-2 lg:row-span-2`}>
              <ServiceCard service={featured} locale={locale} cta={dict.common.learnMore} featured />
            </StaggerItem>
            {others.map((s) => (
              <StaggerItem as="li" key={s.id} className={slideClass}>
                <ServiceCard service={s} locale={locale} cta={dict.common.learnMore} />
              </StaggerItem>
            ))}
            <StaggerItem as="li" className={`${slideClass} sm:col-span-2 lg:col-span-1`}>
              <Link
                href={`/${locale}/servicos`}
                className="tile lift flex h-full min-h-48 flex-col justify-between bg-navy-2 p-7"
              >
                <span className="text-[0.9375rem] leading-relaxed text-muted">{dict.services.lead}</span>
                <span className="link-chevron mt-6">{dict.common.allServices}</span>
              </Link>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Quebra visual */}
      <ParallaxBreak image="/images/convoy.jpg">
        <Reveal>
          <p className="t-display mx-auto max-w-[12ch] text-center md:mx-0 md:text-left">{company.tagline}.</p>
        </Reveal>
      </ParallaxBreak>

      {/* Como funciona: linha do tempo vertical */}
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-[0.9fr_1.1fr] md:gap-20 md:px-8 md:py-28">
        <Reveal className="text-center md:sticky md:top-28 md:self-start md:text-left">
          <SectionHeading label={t.howLabel} title={t.howTitle} />
          <Link href={`/${locale}/solicitar`} className="btn btn-primary">
            {dict.common.requestCta}
          </Link>
        </Reveal>
        <Stagger as="ol" className="relative">
          {t.steps.map((s, i) => (
            <StaggerItem as="li" key={s.title} className="relative grid grid-cols-[3.5rem_1fr] gap-4 pb-14 last:pb-0 md:grid-cols-[5rem_1fr]">
              {i < t.steps.length - 1 && (
                <span aria-hidden className="absolute bottom-0 left-[1.375rem] top-14 w-px bg-line-strong md:left-[1.875rem]" />
              )}
              <span className="num grid size-11 place-items-center rounded-full border border-line-strong text-[0.9375rem] font-semibold md:size-15 md:text-lg">
                {i + 1}
              </span>
              <div className="pt-2 md:pt-3.5">
                <h3 className="t-h3">{s.title}</h3>
                <p className="mt-3 max-w-[46ch] text-muted">{s.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Fundador */}
      <section className="bg-ink-2">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-20 md:px-8 md:py-28">
          <Reveal>
            {/* Celular: 3/4 em pé mostra a altura inteira da foto (quadrada); desktop: quadrado */}
            <div className="tile relative aspect-[3/4] md:aspect-square">
              <Image
                src={company.founderPhoto}
                alt={company.founderName}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="text-center md:text-left">
            <p className="label">{t.founderLabel}</p>
            <h2 className="t-h2 mt-3">{company.founderName}</h2>
            <p className="mt-2 font-medium text-silver">{company.founderRole[locale]}</p>
            {company.founderBio[locale].split("\n\n").map((p, i) => (
              <p key={i} className={`mx-auto max-w-[56ch] text-text/85 md:mx-0 ${i ? "mt-4" : "mt-7"}`}>
                {p}
              </p>
            ))}

            <ul className="mx-auto mt-9 grid w-fit gap-3 sm:grid-cols-2 md:mx-0 md:w-auto">
              {t.credentials.map((c) => (
                <li key={c} className="flex gap-3 text-left text-[0.9375rem]">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-accent" />
                  {c}
                </li>
              ))}
            </ul>

            <Link href={`/${locale}/sobre`} className="link-chevron mt-10 min-h-11">
              {t.founderCta}
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Experiência */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <p className="label text-center">{t.experienceLabel}</p>
          <CompanyLogos
            items={founder.experienceWith}
            className="mt-10 grid grid-cols-2 place-items-center gap-x-6 gap-y-9 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-14 sm:gap-y-8"
          />
        </div>
      </section>

      <CtaBand dict={dict} locale={locale} whatsapp={company.whatsapp} />
    </>
  );
}
