// URL pública do site; definir NEXT_PUBLIC_SITE_URL na Vercel quando o domínio existir
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
