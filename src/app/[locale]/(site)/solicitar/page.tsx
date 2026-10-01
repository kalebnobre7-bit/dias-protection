import type { Metadata } from "next";

import { Configurator } from "@/components/site/Configurator";
import { PageHero } from "@/components/site/PageHero";
import { pageMetadata } from "@/lib/seo";
import { loadPage, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale, dict } = await loadPage(params);
  return pageMetadata({
    locale,
    path: "/solicitar",
    title: `${dict.meta.pages.request} · Dias Protection`,
    description: dict.order.lead,
  });
}

export default async function RequestPage({ params }: LocaleParams) {
  const { locale, dict, content } = await loadPage(params);

  return (
    <>
      <PageHero label={dict.order.label} title={dict.order.title} lead={dict.order.lead} compact />
      <Configurator content={content} dict={dict} locale={locale} />
    </>
  );
}
