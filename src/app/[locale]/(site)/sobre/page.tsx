import type { Metadata } from "next";
import { Check } from "lucide-react";
import Image from "next/image";

import { CompanyLogos } from "@/components/site/CompanyLogos";
import { CtaBand } from "@/components/site/CtaBand";
import { HeroIn, Reveal, Stagger, StaggerItem } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { pageMetadata } from "@/lib/seo";
import { loadPage, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale, dict, content } = await loadPage(params);
  return pageMetadata({
    locale,
    path: "/sobre",
    title: `${dict.meta.pages.about} · Dias Protection`,
    description: content.company.founderBio[locale],
  });
}

export default async function AboutPage({ params }: LocaleParams) {
  const { locale, dict, content } = await loadPage(params);
  const { company, founder } = content;
  const t = dict.about;

  return (
    <>
      {/* Topo: foto + apresentação */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_85%_10%,var(--color-navy-2)_0%,var(--color-ink)_65%)]"
        />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-32 md:grid-cols-[1.2fr_0.8fr] md:items-end md:gap-16 md:px-8 md:pb-24 md:pt-48">
          <HeroIn>
            <p className="label">{t.label}</p>
            <h1 className="t-display mt-4 max-w-[18ch]">{t.title}</h1>
            {company.founderBio[locale].split("\n\n").map((p, i) => (
              <p key={i} className={`max-w-[60ch] text-text/80 ${i ? "mt-4" : "t-lead mt-8 !text-text/80"}`}>
                {p}
              </p>
            ))}
            <p className="mt-8 font-semibold">{company.founderName}</p>
            <p className="mt-0.5 text-[0.9375rem] text-silver">{company.founderRole[locale]}</p>
          </HeroIn>
          <HeroIn delay={0.15}>
            <div className="tile relative aspect-[4/5]">
              <Image
                src={company.founderPhoto}
                alt={company.founderName}
                fill
                priority
                sizes="(min-width: 768px) 35vw, 100vw"
                className="object-cover"
              />
            </div>
          </HeroIn>
        </div>
      </section>

      {/* Barra de números */}
      <section className="border-y border-line bg-ink-2">
        <Stagger as="dl" className="mx-auto grid max-w-7xl gap-px bg-line sm:grid-cols-2">
          {founder.stats.map((s) => (
            <StaggerItem key={s.label.pt} className="bg-ink-2 px-4 py-10 md:px-8 md:py-14">
              <dt className="sr-only">{s.label[locale]}</dt>
              <dd>
                <span className="t-stat block">{s.value}</span>
                <span className="mt-3 block max-w-[44ch] text-[0.9375rem] leading-snug text-muted">{s.label[locale]}</span>
              </dd>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Trajetória */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <Reveal>
          <SectionHeading label={t.storyLabel} title={t.storyTitle} />
        </Reveal>
        <ol className="relative border-l border-line-strong md:ml-2">
          {founder.timeline.map((m, i) => (
            <li key={m.title.pt} className="relative pb-12 pl-8 last:pb-0 md:pl-12">
              <span aria-hidden className="absolute -left-[5px] top-1.5 size-2.5 rounded-full border border-accent bg-ink" />
              <Reveal delay={i * 0.09}>
                <p className="num text-[0.9375rem] font-medium text-accent">{m.period[locale]}</p>
                <h3 className="t-h3 mt-2">{m.title[locale]}</h3>
                <Paragraphs text={m.text[locale]} />
                {m.logos && (
                  <CompanyLogos
                    items={founder.experienceWith}
                    size="sm"
                    className="mt-6 flex max-w-[60ch] flex-wrap items-center gap-x-10 gap-y-5"
                  />
                )}
                {m.more && <Paragraphs text={m.more[locale]} />}
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* Certificações, reconhecimentos, formação */}
      <section className="bg-ink-2">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 md:grid-cols-2 md:gap-20 md:px-8 md:py-28">
          <Reveal>
            <p className="label">{t.certificationsLabel}</p>
            <ul className="mt-6 border-t border-line">
              {founder.certifications.map((c) => (
                <li key={c.pt} className="flex gap-4 border-b border-line py-4">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-accent" />
                  <span>{c[locale]}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="space-y-12">
            <div>
              <p className="label">{t.recognitionsLabel}</p>
              <ul className="mt-6 border-t border-line">
                {founder.recognitions.map((r) => (
                  <li key={r.pt} className="border-b border-line py-4">
                    {r[locale]}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label">{t.educationLabel}</p>
              <ul className="mt-6 border-t border-line">
                {founder.education.map((e) => (
                  <li key={e.pt} className="border-b border-line py-4">
                    {e[locale]}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label">{t.languagesLabel}</p>
              <p className="mt-4">{founder.languages[locale]}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Só aparece com autorização do Gabriel */}
      {founder.showNotableClients && (
        <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
          <p className="label">{t.clientsLabel}</p>
          <p className="mt-2 text-sm text-muted">{t.clientsNote}</p>
          <ul className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {founder.notableClients.map((c) => (
              <li key={c.name} className="border-t border-line pt-4">
                <p className="text-lg">{c.name}</p>
                <p className="text-[0.9375rem] text-muted">{c.context}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CtaBand dict={dict} locale={locale} whatsapp={company.whatsapp} />
    </>
  );
}

function Paragraphs({ text }: { text: string }) {
  return text.split("\n\n").map((p, i) => (
    <p key={i} className="mt-3 max-w-[60ch] text-muted">
      {p}
    </p>
  ));
}
