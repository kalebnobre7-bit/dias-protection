import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Emblem, Wordmark } from "@/components/brand/Logo";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSiteContent } from "@/lib/content";
import { whatsappUrl } from "@/lib/order";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).meta.cardTitle };
}

// Cartão de visita digital: uma tela, sem rolagem no celular
export default async function CardPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const { company } = await getSiteContent();
  const other = locale === "pt" ? "en" : "pt";
  const phone = `+${company.whatsapp.slice(0, 2)} ${company.whatsapp.slice(2, 4)} ${company.whatsapp.slice(4, -4)}-${company.whatsapp.slice(-4)}`;

  const links = [
    { href: whatsappUrl(company.whatsapp), label: dict.card.whatsapp, value: phone, external: true },
    { href: `mailto:${company.email}`, label: dict.card.email, value: company.email, external: false },
    {
      href: `https://instagram.com/${company.instagram}`,
      label: dict.card.instagram,
      value: `@${company.instagram}`,
      external: true,
    },
    {
      href: `https://www.linkedin.com/in/${company.linkedin}`,
      label: dict.card.linkedin,
      value: company.founderShortName,
      external: true,
    },
  ];

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden px-4 py-8">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(100%_60%_at_50%_0%,var(--color-navy-2)_0%,var(--color-ink)_70%)]"
      />

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="flex justify-end">
          <Link href={`/${other}/cartao`} hrefLang={other} aria-label={dict.nav.switchLabel} className="label grid min-h-11 min-w-11 place-items-center px-2 transition-colors duration-300 hover:text-text">
            {dict.nav.switchTo}
          </Link>
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          <Emblem className="h-28 text-text" />
          <Wordmark className="mt-4 h-16 text-text" />
          <div className="mt-8 h-px w-12 bg-line-strong" />
          <h1 className="mt-8 text-[1.75rem] font-semibold tracking-[-0.025em]">{company.founderName}</h1>
          <p className="mt-1 text-[0.9375rem] text-muted">{company.founderRole[locale]}</p>
          <p className="mt-3 text-[0.9375rem] font-medium text-silver">{company.tagline}</p>
        </div>

        <ul className="mt-10 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-navy/60">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex min-h-14 items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-300 hover:bg-navy-2 active:bg-navy-2"
              >
                <span className="text-[0.9375rem] text-muted">{l.label}</span>
                <span className="flex min-w-0 items-center gap-2 text-[0.9375rem]">
                  <span className="truncate">{l.value}</span>
                  <span aria-hidden className="text-muted">›</span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-3">
          <Link
            href={`/${locale}/solicitar`}
            className="btn btn-primary w-full"
          >
            {dict.card.order}
          </Link>
          <a
            href="/vcard"
            className="btn btn-ghost w-full"
          >
            {dict.card.save}
          </a>
        </div>

        <Link href={`/${locale}`} className="link-chevron mx-auto mt-auto pt-10 text-[0.9375rem]">
          {dict.card.site}
        </Link>
      </div>
    </main>
  );
}
