import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/config";
import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Dias Protection";

// Gera no build (necessário para o export estático do GitHub Pages)
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "pt";
  const dict = getDictionary(lang);
  return renderOg({ eyebrow: dict.about.label, title: dict.about.title, image: "images/agent.jpg" });
}
