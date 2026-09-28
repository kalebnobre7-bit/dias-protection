import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";

// Redireciona rotas sem idioma para /pt ou /en conforme o navegador
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";
  if (isLocale(first)) return;

  const accept = request.headers.get("accept-language")?.toLowerCase() ?? "";
  const locale = accept.startsWith("pt") || !accept ? defaultLocale : "en";

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|vcard|brand|icon|apple-icon|favicon.ico|.*\\..*).*)"],
};
