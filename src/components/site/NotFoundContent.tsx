"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDictionary } from "@/i18n/dictionaries";
import { localContent } from "@/data/content";
import { whatsappUrl } from "@/lib/order";
import type { Locale } from "@/lib/types";

import { HeroIn } from "./Reveal";

// Descobre o idioma pela URL real (no GitHub Pages o 404.html é servido para qualquer caminho)
export function useLocaleFromUrl(): Locale {
  const [locale, setLocale] = useState<Locale>("pt");
  useEffect(() => {
    const path = window.location.pathname.replace(process.env.NEXT_PUBLIC_BASE_PATH ?? "", "");
    const first = path.split("/")[1];
    if (first === "en" || (first !== "pt" && !navigator.language.toLowerCase().startsWith("pt"))) setLocale("en");
  }, []);
  return locale;
}

export function NotFoundContent({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.notFound;
  const links = [
    { href: `/${locale}/servicos`, label: dict.nav.services },
    { href: `/${locale}/solicitar`, label: dict.common.requestCta },
    { href: `/${locale}/sobre`, label: dict.nav.about },
  ];

  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_50%_0%,var(--color-navy-2)_0%,var(--color-ink)_65%)]"
      />
      <div className="mx-auto flex min-h-[80svh] max-w-7xl flex-col justify-center px-4 pb-24 pt-36 md:px-8">
        <HeroIn>
          <p className="label">{t.label}</p>
          <h1 className="t-display mt-4 max-w-[16ch]">{t.title}</h1>
          <p className="t-lead mt-6 max-w-[52ch]">{t.lead}</p>
        </HeroIn>
        <HeroIn delay={0.1} className="mt-10 flex flex-col items-start gap-8">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-chevron min-h-11">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={whatsappUrl(localContent.company.whatsapp)} target="_blank" rel="noopener noreferrer" className="link-chevron min-h-11">
                {dict.common.whatsappCta}
              </a>
            </li>
          </ul>
          <Link href={`/${locale}`} className="btn btn-primary">
            {t.home}
          </Link>
        </HeroIn>
      </div>
    </section>
  );
}
