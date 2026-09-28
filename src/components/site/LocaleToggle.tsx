import { BR, US } from "country-flag-icons/react/1x1";
import Link from "next/link";

import type { Locale } from "@/lib/types";

type Props = { locale: Locale; hrefs: Record<Locale, string>; label: string };

const options = [
  { id: "pt", name: "Português", Flag: BR },
  { id: "en", name: "English", Flag: US },
] satisfies { id: Locale; name: string; Flag: typeof BR }[];

// Seletor de idioma em pílula: bandeira do idioma atual destacada, a outra troca de idioma na mesma página
export function LocaleToggle({ locale, hrefs, label }: Props) {
  return (
    <div role="group" aria-label={label} className="flex h-11 items-center rounded-full border border-line p-1">
      {options.map(({ id, name, Flag }) => {
        const active = id === locale;
        const flag = (
          <span
            className={`block size-5 overflow-hidden rounded-full ring-1 ring-white/15 transition-[opacity,filter] duration-300 ease-[var(--ease-in-out)] ${
              active ? "" : "opacity-45 grayscale-[60%] group-hover:opacity-100 group-hover:grayscale-0"
            }`}
          >
            <Flag aria-hidden className="block size-full" />
          </span>
        );
        return active ? (
          <span key={id} aria-current="true" title={name} className="grid h-full w-10 place-items-center rounded-full bg-navy-2">
            {flag}
            <span className="sr-only">{name}</span>
          </span>
        ) : (
          <Link
            key={id}
            href={hrefs[id]}
            hrefLang={id}
            title={name}
            className="group grid h-full w-10 place-items-center rounded-full transition-transform duration-300 ease-[var(--ease-snap)] active:scale-[0.94]"
          >
            {flag}
            <span className="sr-only">{name}</span>
          </Link>
        );
      })}
    </div>
  );
}
