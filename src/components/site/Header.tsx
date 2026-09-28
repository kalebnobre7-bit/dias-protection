"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Emblem, Wordmark } from "@/components/brand/Logo";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/types";

import { LocaleToggle } from "./LocaleToggle";

type Props = { locale: Locale; dict: Dictionary };

export function Header({ locale, dict }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Mesma página no outro idioma
  const localeHrefs: Record<Locale, string> = {
    pt: pathname.replace(/^\/(pt|en)/, "/pt"),
    en: pathname.replace(/^\/(pt|en)/, "/en"),
  };

  const links = [
    { href: `/${locale}/servicos`, label: dict.nav.services },
    { href: `/${locale}/sobre`, label: dict.nav.about },
    { href: `/${locale}/equipe`, label: dict.nav.team },
    { href: `/${locale}/frota`, label: dict.nav.fleet },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Fecha o menu ao navegar e trava a rolagem enquanto aberto
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ease-[var(--ease-in-out)] ${
        scrolled || open
          ? "border-line bg-ink/72 backdrop-blur-[16px] backdrop-saturate-[180%]"
          : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href={`/${locale}`} className="flex min-h-11 items-center gap-2.5 text-text" aria-label="Dias Protection">
          <Emblem className="h-14" />
          <span className="hidden sm:flex">
            <Wordmark className="h-14" />
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[0.875rem] lg:flex" aria-label={dict.nav.menu}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`group relative py-2 transition-colors duration-300 hover:text-text ${isActive(l.href) ? "text-text" : "text-muted"}`}
            >
              {l.label}
              <span
                aria-hidden
                className={`absolute inset-x-0 bottom-0.5 h-px origin-left bg-text transition-transform duration-300 ease-[var(--ease-snap)] ${
                  isActive(l.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleToggle
            locale={locale}
            hrefs={localeHrefs}
            label={dict.nav.switchLabel}
          />
          <Link
            href={`/${locale}/solicitar`}
            className="btn btn-primary hidden !min-h-9 !px-4 !py-2 !text-[0.8125rem] sm:inline-flex"
          >
            {dict.common.requestCta}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dict.nav.close : dict.nav.menu}
            className="grid size-11 place-items-center rounded-full lg:hidden"
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label={dict.nav.menu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}
            className="fixed inset-x-0 bottom-0 top-16 flex flex-col bg-ink px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:hidden"
          >
            <ul className="border-t border-line">
              {[{ href: `/${locale}`, label: dict.nav.home }, ...links].map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.08 * i + 0.05 }}
                >
                  <Link
                    href={l.href}
                    className="flex items-center justify-between border-b border-line py-4 text-[1.75rem] font-semibold tracking-[-0.025em]"
                    aria-current={pathname === l.href ? "page" : undefined}
                  >
                    {l.label}
                    <span aria-hidden className="text-xl font-normal text-muted">›</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <Link
              href={`/${locale}/solicitar`}
              className="btn btn-primary mt-auto w-full"
            >
              {dict.common.requestCta}
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
