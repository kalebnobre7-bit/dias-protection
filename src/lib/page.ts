import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

import { getSiteContent } from "./content";

export type LocaleParams = { params: Promise<{ locale: string }> };

// Valida o idioma da rota e carrega textos + conteúdo de uma vez
export async function loadPage(params: LocaleParams["params"]) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, dict: getDictionary(locale), content: await getSiteContent() };
}
