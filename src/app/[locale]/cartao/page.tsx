import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BusinessCard } from "@/components/site/BusinessCard";
import { LocaleToggle } from "@/components/site/LocaleToggle";
import { ShareButton } from "@/components/site/ShareButton";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSiteContent } from "@/lib/content";
import { whatsappUrl } from "@/lib/order";
import { qrPath } from "@/lib/qr";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/cartao", title: dict.meta.cardTitle, description: dict.meta.description });
}

// Cartão de visita digital: cartão que vira (marca / contato + QR), links e ações
export default async function CardPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const { company } = await getSiteContent();
  const phone = `+${company.whatsapp.slice(0, 2)} ${company.whatsapp.slice(2, 4)} ${company.whatsapp.slice(4, -4)}-${company.whatsapp.slice(-4)}`;
  // O QR aponta pra esta mesma página: quem escaneia já cai no cartão
  const qr = qrPath(`${siteUrl}/${locale}/cartao`);

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
          <LocaleToggle locale={locale} hrefs={{ pt: "/pt/cartao", en: "/en/cartao" }} label={dict.nav.switchLabel} />
        </div>

        <div className="mt-6">
          <BusinessCard
            name={company.founderName}
            role={company.founderRole[locale]}
            tagline={company.tagline}
            photo={company.founderPhoto}
            phone={phone}
            email={company.email}
            instagram={company.instagram}
            qr={qr}
            labels={{ flip: dict.card.flip, scan: dict.card.scan }}
          />
          <p className="mt-3 text-center text-[0.8125rem] text-muted">{dict.card.flipHint}</p>
        </div>

        <ul className="mt-8 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-navy/60">
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
          <a href={`${process.env.NEXT_PUBLIC_BASE_PATH}/contato.vcf`} className="btn btn-primary w-full">
            {dict.card.save}
          </a>
          <div className="grid grid-cols-2 gap-3">
            <ShareButton
              title={`${company.founderName} · ${company.brandName}`}
              text={company.founderRole[locale]}
              label={dict.card.share}
              copied={dict.card.copied}
              className="btn btn-ghost w-full !px-4"
            />
            <Link href={`/${locale}/solicitar`} className="btn btn-ghost w-full !px-4">
              {dict.card.order}
            </Link>
          </div>
        </div>

        <Link href={`/${locale}`} className="link-chevron mx-auto mt-auto pt-10 text-[0.9375rem]">
          {dict.card.site}
        </Link>
      </div>
    </main>
  );
}
