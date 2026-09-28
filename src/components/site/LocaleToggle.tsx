import Link from "next/link";

import type { Locale } from "@/lib/types";

type Props = { locale: Locale; hrefs: Record<Locale, string>; label: string };

const options: { id: Locale; name: string; Flag: () => React.JSX.Element }[] = [
  { id: "pt", name: "Português", Flag: FlagBR },
  { id: "en", name: "English", Flag: FlagUS },
];

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
            <Flag />
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

function FlagBR() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="size-full">
      <rect width="20" height="20" fill="#009c3b" />
      <path d="M10 3.2 18.4 10 10 16.8 1.6 10Z" fill="#ffdf00" />
      <circle cx="10" cy="10" r="3.9" fill="#002776" />
      <path d="M6.3 9.2c2.5-.4 5-.1 7.4 1" stroke="#fff" strokeWidth=".8" fill="none" />
    </svg>
  );
}

function FlagUS() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="size-full">
      <rect width="20" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 20) / 13} width="20" height={20 / 13} fill="#b22234" />
      ))}
      <rect width="10" height={(20 / 13) * 7} fill="#3c3b6e" />
      {[
        [2, 2], [5, 2], [8, 2],
        [3.5, 4.5], [6.5, 4.5],
        [2, 7], [5, 7], [8, 7],
        [3.5, 9.5], [6.5, 9.5],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r=".55" fill="#fff" />
      ))}
    </svg>
  );
}
