import Image from "next/image";
import Link from "next/link";

import type { Dictionary } from "@/i18n/dictionaries";
import { whatsappUrl } from "@/lib/order";
import type { Locale } from "@/lib/types";

import { Reveal } from "./Reveal";

type Props = { dict: Dictionary; locale: Locale; whatsapp: string };

export function CtaBand({ dict, locale, whatsapp }: Props) {
  return (
    <section className="relative isolate overflow-hidden">
      <Image src="/images/airport.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
      <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-8 md:py-28 md:text-left">
        <Reveal>
          <h2 className="t-display mx-auto max-w-[16ch] md:mx-0">{dict.home.ctaTitle}</h2>
          <p className="t-lead mx-auto mt-6 max-w-[46ch] !text-text/75 md:mx-0">{dict.home.ctaText}</p>
          <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8 md:justify-start">
            <Link href={`/${locale}/solicitar`} className="btn btn-primary">
              {dict.common.requestCta}
            </Link>
            <a href={whatsappUrl(whatsapp)} target="_blank" rel="noopener noreferrer" className="link-chevron min-h-11">
              {dict.common.whatsappCta}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
