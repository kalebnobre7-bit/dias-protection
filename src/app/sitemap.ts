import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { getSiteContent } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { serviceTypes } = await getSiteContent();
  const paths = ["", "/servicos", "/sobre", "/equipe", "/frota", "/solicitar", "/cartao", ...serviceTypes.map((s) => `/servicos/${s.id}`)];

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`])) },
    })),
  );
}
