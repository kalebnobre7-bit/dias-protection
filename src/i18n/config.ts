import type { Locale } from "@/lib/types";

export const locales: Locale[] = ["pt", "en"];
export const defaultLocale: Locale = "pt";

export function isLocale(value: string): value is Locale {
  return (locales as string[]).includes(value);
}
