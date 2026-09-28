import Link from "next/link";

import { Emblem, Wordmark } from "@/components/brand/Logo";
import type { Dictionary } from "@/i18n/dictionaries";
import { whatsappUrl } from "@/lib/order";
import type { Company, Locale, ServiceType } from "@/lib/types";

type Props = { dict: Dictionary; company: Company; services: ServiceType[]; locale: Locale };

export function Footer({ dict, company, services, locale }: Props) {
  const nav = [
    { href: `/${locale}/servicos`, label: dict.nav.services },
    { href: `/${locale}/sobre`, label: dict.nav.about },
    { href: `/${locale}/equipe`, label: dict.nav.team },
    { href: `/${locale}/frota`, label: dict.nav.fleet },
    { href: `/${locale}/solicitar`, label: dict.common.requestCta },
    { href: `/${locale}/cartao`, label: dict.footer.card },
  ];
  const contacts = [
    { href: whatsappUrl(company.whatsapp), label: "WhatsApp" },
    { href: `mailto:${company.email}`, label: company.email },
    { href: `https://instagram.com/${company.instagram}`, label: `@${company.instagram}` },
    { href: `https://www.linkedin.com/in/${company.linkedin}`, label: "LinkedIn" },
  ];

  return (
    <footer className="border-t border-line bg-ink-2">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 md:px-8 md:pt-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3 text-text">
              <Emblem className="h-16" />
              <Wordmark className="h-16" />
            </div>
            <p className="mt-6 max-w-[36ch] text-[0.9375rem] leading-relaxed text-muted">{dict.footer.pitch}</p>
            <p className="mt-4 text-[0.9375rem] font-medium text-silver">{company.tagline}</p>
          </div>

          <FooterList title={dict.footer.navLabel}>
            {nav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-text">
                  {l.label}
                </Link>
              </li>
            ))}
          </FooterList>

          <FooterList title={dict.nav.services}>
            {services.map((s) => (
              <li key={s.id}>
                <Link href={`/${locale}/servicos/${s.id}`} className="hover:text-text">
                  {s.name[locale]}
                </Link>
              </li>
            ))}
          </FooterList>

          <FooterList title={dict.footer.contactLabel}>
            {contacts.map((c) => (
              <li key={c.href}>
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="break-all hover:text-text">
                  {c.label}
                </a>
              </li>
            ))}
            <li className="pt-2 text-muted">{company.city}</li>
          </FooterList>
        </div>

        <p className="num mt-16 border-t border-line pt-6 text-xs text-muted">
          © {new Date().getFullYear()} {company.brandName} · {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}

function FooterList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label">{title}</p>
      <ul className="mt-5 space-y-3 text-[0.9375rem] text-muted [&_a]:transition-colors [&_a]:duration-300">{children}</ul>
    </div>
  );
}
