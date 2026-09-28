import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Emblem } from "@/components/brand/Logo";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, Stagger, StaggerItem } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { loadPage, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await loadPage(params);
  return { title: `${dict.meta.pages.team} · Dias Protection`, description: dict.team.lead };
}

export default async function TeamPage({ params }: LocaleParams) {
  const { locale, dict, content } = await loadPage(params);
  const { company, agents } = content;
  const t = dict.team;

  return (
    <>
      <PageHero label={t.label} title={t.title} lead={t.lead} image="/images/event.jpg" />

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Fundador sempre primeiro */}
          <li>
            <Reveal className="h-full">
              <Link
                href={`/${locale}/sobre`}
                className="tile lift group flex h-full flex-col"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={company.founderPhoto}
                    alt={company.founderName}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="media-zoom object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="t-h3">{company.founderName}</h3>
                  <p className="mt-1 text-[0.9375rem] text-muted">{company.founderRole[locale]}</p>
                  <span className="link-chevron mt-4 text-[0.9375rem]">{dict.home.founderCta}</span>
                </div>
              </Link>
            </Reveal>
          </li>

          {agents.map((a, i) => (
            <li key={a.id}>
              <Reveal delay={((i + 1) % 3) * 0.06} className="h-full">
                <article className="tile flex h-full flex-col">
                  <div className="relative aspect-[4/5] bg-[linear-gradient(180deg,var(--color-navy-2),var(--color-ink))]">
                    {a.photoUrl ? (
                      <Image
                        src={a.photoUrl}
                        alt={a.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover grayscale"
                      />
                    ) : (
                      <Emblem className="absolute left-1/2 top-1/2 h-1/3 -translate-x-1/2 -translate-y-1/2 text-silver/15" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="t-h3">{a.name}</h3>
                    <p className="mt-1 text-[0.9375rem] text-muted">{a.role[locale]}</p>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-text/80">{a.bio[locale]}</p>
                    <dl className="num mt-auto space-y-2 border-t border-line pt-5 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">{t.languages}</dt>
                        <dd>{a.languages.join(" · ")}</dd>
                      </div>
                      {a.yearsExperience !== null && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted">{t.years}</dt>
                          <dd>{a.yearsExperience}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Critérios de seleção */}
      <section className="bg-ink-2">
        <div className="mx-auto max-w-7xl px-4 py-28 md:px-8 md:py-40">
          <Reveal>
            <SectionHeading label={t.criteriaLabel} title={t.lead} />
          </Reveal>
          <Stagger as="ol" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.criteria.map((c, i) => (
              <StaggerItem as="li" key={c.title} className="tile p-7">
                <span className="num grid size-10 place-items-center rounded-full border border-line-strong text-[0.9375rem] font-semibold">
                  {i + 1}
                </span>
                <h3 className="t-h3 mt-8">{c.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{c.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CtaBand dict={dict} locale={locale} whatsapp={company.whatsapp} />
    </>
  );
}
