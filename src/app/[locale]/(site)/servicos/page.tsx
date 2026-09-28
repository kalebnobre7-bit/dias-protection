import type { Metadata } from "next";

import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { Stagger, StaggerItem } from "@/components/site/Reveal";
import { ServiceCard } from "@/components/site/ServiceCard";
import { loadPage, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await loadPage(params);
  return { title: `${dict.meta.pages.services} · Dias Protection`, description: dict.services.lead };
}

export default async function ServicesPage({ params }: LocaleParams) {
  const { locale, dict, content } = await loadPage(params);

  return (
    <>
      <PageHero
        label={dict.services.label}
        title={dict.services.title}
        lead={dict.services.lead}
        image="/images/hotel.jpg"
      />
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.serviceTypes.map((s, i) => (
            <StaggerItem as="li" key={s.id} className={i === 0 ? "sm:col-span-2 lg:row-span-2" : ""}>
              <ServiceCard service={s} locale={locale} cta={dict.common.learnMore} featured={i === 0} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>
      <CtaBand dict={dict} locale={locale} whatsapp={content.company.whatsapp} />
    </>
  );
}
