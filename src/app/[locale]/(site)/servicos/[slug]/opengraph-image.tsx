import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/config";
import { localContent } from "@/data/content";
import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Dias Protection";

// Gera no build (necessário para o export estático do GitHub Pages)
export function generateStaticParams() {
  return locales.flatMap((locale) => localContent.serviceTypes.map((s) => ({ locale, slug: s.id })));
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const lang = isLocale(locale) ? locale : "pt";
  const dict = getDictionary(lang);
  const service = localContent.serviceTypes.find((s) => s.id === slug) ?? localContent.serviceTypes[0];
  return renderOg({ eyebrow: dict.nav.services, title: service.name[lang], image: service.image.replace(/^\//, "") });
}
