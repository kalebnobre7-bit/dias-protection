import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CtaBand } from "@/components/site/CtaBand";
import { HeroIn, Reveal } from "@/components/site/Reveal";
import { locales } from "@/i18n/config";
import { getSiteContent } from "@/lib/content";
import { loadPage } from "@/lib/page";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const { serviceTypes } = await getSiteContent();
  return locales.flatMap((locale) => serviceTypes.map((s) => ({ locale, slug: s.id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale, content } = await loadPage(params);
  const service = content.serviceTypes.find((s) => s.id === slug);
  if (!service) return {};
  return { title: `${service.name[locale]} · Dias Protection`, description: service.summary[locale] };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const { locale, dict, content } = await loadPage(params);
  const index = content.serviceTypes.findIndex((s) => s.id === slug);
  if (index === -1) notFound();

  const service = content.serviceTypes[index];
  const others = content.serviceTypes.filter((s) => s.id !== slug);
  const requestHref = `/${locale}/solicitar?servico=${service.id}`;

  return (
    <>
      {/* Topo com a imagem do serviço */}
      <section className="relative isolate overflow-hidden">
        <Image src={service.image} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/75 to-ink/30" />
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-36 md:px-8 md:pb-20 md:pt-56">
          <HeroIn>
            <nav aria-label="Breadcrumb" className="text-[0.9375rem]">
              <Link href={`/${locale}/servicos`} className="text-muted transition-colors duration-300 hover:text-text">
                {dict.nav.services}
              </Link>
              <span aria-hidden className="mx-2 text-muted">›</span>
            </nav>
            <h1 className="t-display mt-3 max-w-[16ch]">{service.name[locale]}</h1>
            <p className="t-lead mt-6 max-w-[48ch] !text-text/80">{service.summary[locale]}</p>
            <Link href={requestHref} className="btn btn-primary mt-10">
              {dict.common.requestThis}
            </Link>
          </HeroIn>
        </div>
      </section>

      {/* Descrição + o que inclui */}
      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-20 md:grid-cols-[1.2fr_1fr] md:gap-20 md:px-8 md:py-32">
        <Reveal>
          <p className="text-[clamp(1.25rem,2vw,1.625rem)] leading-[1.45] tracking-[-0.015em]">{service.description[locale]}</p>
          <div className="mt-12 border-t border-line pt-8">
            <p className="label">{dict.common.idealFor}</p>
            <p className="mt-3 text-text/85">{service.idealFor[locale]}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="tile p-7 md:p-9">
            <p className="label">{dict.common.includes}</p>
            <ul className="mt-6 space-y-4">
              {service.includes[locale].map((item) => (
                <li key={item} className="flex gap-4 border-b border-line pb-4 last:border-0 last:pb-0">
                  <svg aria-hidden viewBox="0 0 16 16" className="mt-1 size-4 shrink-0 text-accent">
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href={requestHref}
              className="btn btn-primary mt-8 w-full"
            >
              {dict.common.requestThis}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Outros serviços */}
      <section className="bg-ink-2">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <p className="label">{dict.common.otherServices}</p>
          <ul className="mt-6 border-t border-line">
            {others.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/${locale}/servicos/${s.id}`}
                  className="group flex min-h-16 items-center justify-between gap-6 border-b border-line py-5 transition-colors duration-300 hover:text-silver"
                >
                  <span className="t-h3">{s.name[locale]}</span>
                  <span className="hidden flex-1 text-right text-sm text-muted md:block">{s.summary[locale]}</span>
                  <span aria-hidden className="text-2xl text-accent transition-transform duration-300 ease-[var(--ease-snap)] group-hover:translate-x-1">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand dict={dict} locale={locale} whatsapp={content.company.whatsapp} />
    </>
  );
}
