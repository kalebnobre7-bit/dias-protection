"use client";

import { getDictionary } from "@/i18n/dictionaries";
import { localContent } from "@/data/content";

import { Footer } from "./Footer";
import { Header } from "./Header";
import { NotFoundContent, useLocaleFromUrl } from "./NotFoundContent";

// Tela completa (menu + rodapé) para a global-not-found, que fica fora do layout do site
export function NotFoundScreen() {
  const locale = useLocaleFromUrl();
  const dict = getDictionary(locale);
  const services = [...localContent.serviceTypes].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <>
      <Header locale={locale} dict={dict} />
      <main>
        <NotFoundContent locale={locale} />
      </main>
      <Footer dict={dict} company={localContent.company} services={services} locale={locale} />
    </>
  );
}
