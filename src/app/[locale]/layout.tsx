import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";

import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { siteUrl } from "@/lib/site";

import "../globals.css";

// Fallback fora do ecossistema Apple (lá quem renderiza é a SF Pro nativa)
const inter = Inter({ subsets: ["latin"], axes: ["opsz"], variable: "--font-inter", display: "swap" });

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: { languages: { "pt-BR": "/pt", en: "/en" } },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      type: "website",
      images: [{ url: "/images/hero-suv.jpg", width: 1672, height: 941 }],
    },
  };
}

export const viewport: Viewport = { themeColor: "#07090d" };

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale === "pt" ? "pt-BR" : "en"} className={inter.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
