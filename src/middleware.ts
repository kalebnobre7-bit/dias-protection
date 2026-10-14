import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";

// Redireciona rotas sem idioma para /pt ou /en conforme o navegador
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  // Painel travado em produção enquanto o login é de demonstração; liberar com ADMIN_ENABLED=true
  if (first === "admin") {
    if (process.env.NODE_ENV === "production" && process.env.ADMIN_ENABLED !== "true") {
      const url = request.nextUrl.clone();
      url.pathname = `/${defaultLocale}`;
      return NextResponse.redirect(url);
    }
    return;
  }

  if (isLocale(first)) return;

  const accept = request.headers.get("accept-language")?.toLowerCase() ?? "";
  const locale = accept.startsWith("pt") || !accept ? defaultLocale : "en";

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|brand|icon|apple-icon|favicon.ico|.*\\..*).*)"],
};
