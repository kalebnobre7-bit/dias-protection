import type { Metadata } from "next";

import type { Dictionary } from "@/i18n/dictionaries";
import { siteUrl } from "@/lib/site";
import type { Locale, SiteContent } from "@/lib/types";

type PageMeta = { locale: Locale; path: string; title: string; description: string };

// Metadata por página: canonical e alternância PT/EN apontando para a MESMA página
export function pageMetadata({ locale, path, title, description }: PageMeta): Metadata {
  // metadataBase é só a origem, então o basePath (GitHub Pages) entra aqui
  const url = (l: Locale) => `${process.env.NEXT_PUBLIC_BASE_PATH}/${l}${path}`;
  return {
    title,
    description,
    alternates: {
      canonical: url(locale),
      languages: { "pt-BR": url("pt"), en: url("en"), "x-default": url("pt") },
    },
    openGraph: {
      title,
      description,
      url: url(locale),
      siteName: "Dias Protection",
      locale: locale === "pt" ? "pt_BR" : "en_US",
      alternateLocale: locale === "pt" ? "en_US" : "pt_BR",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Dados estruturados da empresa (Google: nome, contato, área atendida, serviços)
export function businessJsonLd(content: SiteContent, dict: Dictionary, locale: Locale) {
  const { company, serviceTypes } = content;
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#business`,
    name: company.brandName,
    legalName: company.legalName,
    slogan: company.tagline,
    description: dict.meta.description,
    url: `${siteUrl}/${locale}`,
    logo: `${siteUrl}/icon.png`,
    image: `${siteUrl}/images/hero-suv.jpg`,
    telephone: `+${company.whatsapp}`,
    email: company.email,
    address: { "@type": "PostalAddress", addressLocality: "São Paulo", addressRegion: "SP", addressCountry: "BR" },
    areaServed: { "@type": "City", name: "São Paulo" },
    knowsLanguage: ["pt-BR", "en", "es"],
    sameAs: [`https://instagram.com/${company.instagram}`, `https://www.linkedin.com/in/${company.linkedin}`],
    founder: {
      "@type": "Person",
      name: company.founderName,
      jobTitle: company.founderRole[locale],
      sameAs: `https://www.linkedin.com/in/${company.linkedin}`,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: dict.nav.services,
      itemListElement: serviceTypes.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name[locale], url: `${siteUrl}/${locale}/servicos/${s.id}` },
      })),
    },
  };
}

export function JsonLd({ data }: { data: object }) {
  // "<" escapado para o JSON não fechar a tag <script>
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
