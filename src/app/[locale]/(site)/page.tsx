import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CtaBand } from "@/components/site/CtaBand";
import { ParallaxBreak } from "@/components/site/ParallaxBreak";
import { HeroIn, Reveal, Stagger, StaggerItem } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ServiceCard } from "@/components/site/ServiceCard";
import { whatsappUrl } from "@/lib/order";
import { loadPage, type LocaleParams } from "@/lib/page";

export default async function Home({ params }: LocaleParams) {
  const { locale, dict, content } = await loadPage(params);
  const { company, founder, serviceTypes } = content;
  const [featured, ...others] = serviceTypes;
  const t = dict.home;

  return (
    <>
      {/* Hero: imagem em tela cheia, um CTA principal */}
      <section className="relative isolate flex min-h-[min(100dvh,60rem)] items-end overflow-hidden">
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

        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-32 md:px-8 md:pb-28">
          <HeroIn>
            <p className="label !text-silver">{t.eyebrow}</p>
            <h1 className="t-hero mt-5 max-w-[13ch]">{t.title}</h1>
          </HeroIn>
          <HeroIn delay={0.1}>
            <p className="t-lead mt-7 max-w-[48ch] !text-text/80">{t.lead}</p>
          </HeroIn>
          <HeroIn delay={0.2} className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
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
        <Stagger as="dl" className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-line md:grid-cols-4">
          {founder.stats.map((s) => (
            <StaggerItem key={s.label.pt} className="bg-ink-2 px-4 py-10 md:px-8 md:py-14">
              <dt className="sr-only">{s.label[locale]}</dt>
              <dd>
                <span className="t-stat block">{s.value}</span>
                <span className="mt-3 block max-w-[18ch] text-[0.9375rem] leading-snug text-muted">{s.label[locale]}</span>
              </dd>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Intro */}
      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-28 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-20 md:px-8 md:py-40">
        <Reveal>
          <SectionHeading label={t.introLabel} title={t.introTitle} />
          <p className="max-w-[58ch] text-text/85">{company.about[locale]}</p>
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
        <Reveal delay={0.1}>
          <figure className="tile relative aspect-[4/5]">
            <Image src="/images/hotel.jpg" alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
          </figure>
        </Reveal>
      </section>

      {/* Serviços: bento com uma célula dominante */}
      <section className="bg-ink-2">
        <div className="mx-auto max-w-7xl px-4 py-28 md:px-8 md:py-40">
          <Reveal>
            <SectionHeading label={t.servicesLabel} title={t.servicesTitle} />
          </Reveal>
          <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StaggerItem as="li" className="sm:col-span-2 lg:row-span-2">
              <ServiceCard service={featured} locale={locale} cta={dict.common.learnMore} featured />
            </StaggerItem>
            {others.map((s) => (
              <StaggerItem as="li" key={s.id}>
                <ServiceCard service={s} locale={locale} cta={dict.common.learnMore} />
              </StaggerItem>
            ))}
            <StaggerItem as="li" className="sm:col-span-2 lg:col-span-1">
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
          <p className="t-hero max-w-[12ch]">{company.tagline}.</p>
        </Reveal>
      </ParallaxBreak>

      {/* Como funciona: linha do tempo vertical */}
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-28 md:grid-cols-[0.9fr_1.1fr] md:gap-20 md:px-8 md:py-40">
        <Reveal className="md:sticky md:top-28 md:self-start">
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
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-28 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-20 md:px-8 md:py-40">
          <Reveal>
            <div className="tile relative aspect-square">
              <Image
                src={company.founderPhoto}
                alt={company.founderName}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="label">{t.founderLabel}</p>
            <h2 className="t-h2 mt-3">{company.founderName}</h2>
            <p className="mt-2 font-medium text-silver">{company.founderRole[locale]}</p>
            <p className="mt-7 max-w-[56ch] text-text/85">{company.founderBio[locale]}</p>

            <ul className="mt-9 grid gap-3 sm:grid-cols-2">
              {t.credentials.map((c) => (
                <li key={c} className="flex gap-3 text-[0.9375rem]">
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
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-24">
          <p className="label text-center">{t.experienceLabel}</p>
          <Stagger as="ul" className="mt-9 flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
            {founder.experienceWith.map((name) => (
              <StaggerItem as="li" key={name} className="text-xl font-semibold tracking-[-0.02em] text-silver/70 md:text-2xl">
                {name}
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CtaBand dict={dict} locale={locale} whatsapp={company.whatsapp} />
    </>
  );
}
