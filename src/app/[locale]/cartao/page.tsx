import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Globe, Mail, MapPin, Phone, RotateCw, Send, UserPlus } from "lucide-react";
import { notFound } from "next/navigation";

import { Emblem } from "@/components/brand/Logo";
import { InstagramIcon, LinkedInIcon, WhatsAppIcon } from "@/components/brand/SocialIcons";
import { BusinessCard } from "@/components/site/BusinessCard";
import { LocaleToggle } from "@/components/site/LocaleToggle";
import { ShareButton } from "@/components/site/ShareButton";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSiteContent } from "@/lib/content";
import { whatsappUrl } from "@/lib/order";
import { qrPath } from "@/lib/qr";
import { JsonLd, pageMetadata, personJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/cartao", title: dict.meta.cardTitle, description: dict.meta.description });
}

// Cartão de visita digital: cartão que vira (marca / contato + QR), redes com ícone e ações
export default async function CardPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const { company } = await getSiteContent();
  const phone = `+${company.whatsapp.slice(0, 2)} ${company.whatsapp.slice(2, 4)} ${company.whatsapp.slice(4, -4)}-${company.whatsapp.slice(-4)}`;
  // O QR aponta pra esta mesma página: quem escaneia já cai no cartão
  const qr = qrPath(`${siteUrl}/${locale}/cartao`);

  const tiles: TileProps[] = [
    {
      href: `https://instagram.com/${company.instagram}`,
      label: dict.card.instagram,
      value: `@${company.instagram}`,
      icon: <InstagramIcon className="size-[22px]" />,
      iconClass: "bg-[linear-gradient(45deg,#f9ce34_0%,#ee2a7b_50%,#6228d7_100%)] text-white",
    },
    {
      href: `https://www.linkedin.com/in/${company.linkedin}`,
      label: dict.card.linkedin,
      value: company.founderShortName,
      icon: <LinkedInIcon className="size-5" />,
      iconClass: "bg-[#0a66c2] text-white",
    },
    {
      href: `mailto:${company.email}`,
      label: dict.card.email,
      value: company.email,
      icon: <Mail className="size-5" strokeWidth={1.75} />,
      iconClass: "bg-text text-ink",
    },
    {
      href: `tel:+${company.whatsapp}`,
      label: dict.card.call,
      value: phone,
      icon: <Phone className="size-5" strokeWidth={1.75} />,
      iconClass: "bg-text text-ink",
    },
  ];

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden px-4 pb-10 pt-6">
      <JsonLd data={personJsonLd(company, locale)} />
      {/* Fundo: marinho no topo + brilho azul discreto atrás do cartão */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink">
        <div className="absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(90%_60%_at_50%_0%,var(--color-navy-2)_0%,transparent_100%)]" />
        <div className="absolute left-1/2 top-40 size-[28rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col md:max-w-4xl">
        <div className="flex items-center justify-between">
          <span className="label flex items-center gap-2">
            <Emblem className="h-5 text-silver" />
            {dict.footer.card}
          </span>
          <LocaleToggle locale={locale} hrefs={{ pt: "/pt/cartao", en: "/en/cartao" }} label={dict.nav.switchLabel} />
        </div>

        {/* Celular: uma coluna. Desktop: cartão à esquerda, contatos à direita */}
        <div className="md:mt-10 md:grid md:grid-cols-[1.15fr_1fr] md:items-center md:gap-12">
          <div className="hero-in mt-6 md:mt-0">
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
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.8125rem] text-muted">
              <RotateCw className="size-3.5" aria-hidden />
              {dict.card.flipHint}
            </p>
          </div>

          <div>
            {/* WhatsApp em destaque: é o canal principal */}
            <a
              href={whatsappUrl(company.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-in group mt-8 flex items-center gap-4 rounded-3xl border border-[#25d366]/30 bg-[linear-gradient(135deg,rgb(37_211_102/0.18)_0%,rgb(37_211_102/0.04)_100%)] p-4 transition-[transform,border-color] duration-300 ease-[var(--ease-snap)] hover:border-[#25d366]/60 active:scale-[0.98] md:mt-0"
              style={{ animationDelay: "80ms" }}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#25d366] text-white shadow-[0_8px_24px_-6px_rgb(37_211_102/0.6)]">
                <WhatsAppIcon className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{dict.card.chat}</span>
                <span className="num block truncate text-sm text-silver">{phone}</span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-[#25d366] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </a>

            <ul className="mt-3 grid grid-cols-2 gap-3">
              {tiles.map((t, i) => (
                <li key={t.label} className="hero-in" style={{ animationDelay: `${140 + i * 50}ms` }}>
                  <Tile {...t} />
                </li>
              ))}
            </ul>

            <div className="hero-in mt-6 grid gap-3" style={{ animationDelay: "380ms" }}>
              <a href={`${process.env.NEXT_PUBLIC_BASE_PATH}/contato.vcf`} className="btn btn-primary w-full">
                <UserPlus className="size-[1.1em]" aria-hidden />
                {dict.card.save}
              </a>
              <div className="grid grid-cols-2 gap-3">
                <ShareButton
                  title={`${company.founderName} · ${company.brandName}`}
                  text={company.founderRole[locale]}
                  label={dict.card.share}
                  copied={dict.card.copied}
                  className="btn btn-ghost w-full whitespace-nowrap !px-3"
                />
                <Link href={`/${locale}/solicitar`} className="btn btn-ghost w-full whitespace-nowrap !px-3">
                  <Send className="size-[1.1em]" aria-hidden />
                  {dict.card.order}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col items-center gap-2 pt-10 text-center">
          <Link href={`/${locale}`} className="link-chevron text-[0.9375rem]">
            <Globe className="size-4" aria-hidden />
            {dict.card.site}
          </Link>
          <span className="flex items-center gap-1.5 text-[0.8125rem] text-muted">
            <MapPin className="size-3.5" aria-hidden />
            {company.city}
          </span>
        </div>
      </div>
    </main>
  );
}

type TileProps = { href: string; label: string; value: string; icon: React.ReactNode; iconClass: string };

function Tile({ href, label, value, icon, iconClass }: TileProps) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex h-full flex-col gap-4 rounded-3xl border border-line bg-navy/60 p-4 backdrop-blur-[12px] transition-[transform,border-color,background-color] duration-300 ease-[var(--ease-snap)] hover:border-line-strong hover:bg-navy-2/70 active:scale-[0.97]"
    >
      <span className="flex items-start justify-between">
        <span className={`grid size-11 place-items-center rounded-2xl ${iconClass}`}>{icon}</span>
        <ArrowUpRight
          className="size-4 text-muted transition-[transform,color] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-text"
          aria-hidden
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-medium">{label}</span>
        <span className="num block truncate text-[0.8125rem] text-muted">{value}</span>
      </span>
    </a>
  );
}
