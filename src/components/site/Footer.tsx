import Link from "next/link";

import { Emblem, Wordmark } from "@/components/brand/Logo";
import { CompanyLogos } from "@/components/site/CompanyLogos";
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
      {company.trustedBy.length > 0 && (
        <div className="border-b border-line">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-16">
            <p className="label text-center">{dict.footer.trustedBy}</p>
            <CompanyLogos
              items={company.trustedBy}
              size="sm"
              className="mt-10 grid grid-cols-2 place-items-center gap-x-6 gap-y-8 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-12 sm:gap-y-9"
            />

            {company.events.length > 0 && (
              <div className="mt-16 border-t border-line pt-12">
                <p className="label text-center">{dict.footer.eventsTitle}</p>
                <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
                  {company.events.map((e) => (
                    <li key={e.name} className="bg-ink-2 p-6">
                      <p className="flex min-h-7 items-center font-semibold tracking-[-0.01em] text-silver">
                        {e.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${process.env.NEXT_PUBLIC_BASE_PATH}${e.logo}`}
                            alt={e.name}
                            loading="lazy"
                            style={{ height: `${1.25 * (e.scale ?? 1)}rem` }}
                            className="w-auto opacity-70 [filter:brightness(0)_invert(1)]"
                          />
                        ) : (
                          e.name
                        )}
                      </p>
                      {e.groups.length > 0 && (
                        <dl className="mt-4 space-y-2 text-[0.8125rem] leading-relaxed">
                          {e.groups.map((g, i) => (
                            <div key={i} className="sm:flex sm:gap-3">
                              {g.label && <dt className="shrink-0 text-muted sm:w-32">{g.label[locale]}</dt>}
                              <dd className="text-silver/80">{g.names.join(" · ")}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 md:px-8 md:pt-20">
        <div className="grid gap-12 text-center md:grid-cols-[1.4fr_1fr_1fr_1fr] md:text-left">
          <div>
            <div className="flex items-center justify-center gap-3 text-text md:justify-start">
              <Emblem className="h-16" />
              <Wordmark className="h-16" />
            </div>
            <p className="mx-auto mt-6 max-w-[36ch] text-[0.9375rem] leading-relaxed text-muted md:mx-0">{dict.footer.pitch}</p>
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
            <li className="text-muted">{dict.footer.coverage}</li>
          </FooterList>
        </div>

        <p className="num mt-16 border-t border-line pt-6 text-center text-xs text-muted md:text-left">
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
