import { getSiteContent } from "@/lib/content";
import { siteUrl } from "@/lib/site";

// Gerado no build: funciona também no export estático (GitHub Pages)
export const dynamic = "force-static";

// Gera o .vcf pra "Salvar contato" no celular
export async function GET() {
  const { company } = await getSiteContent();
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1");

  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(company.founderName)} · ${esc(company.brandName)}`,
    `N:Dias;Gabriel;Sabino;;`,
    `ORG:${esc(company.brandName)}`,
    `TITLE:${esc(company.founderRole.pt)}`,
    `TEL;TYPE=CELL:+${company.whatsapp}`,
    `EMAIL;TYPE=WORK:${company.email}`,
    `URL:${siteUrl}/pt`,
    `X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${company.instagram}`,
    `X-SOCIALPROFILE;TYPE=linkedin:https://www.linkedin.com/in/${company.linkedin}`,
    "END:VCARD",
  ].join("\r\n");

  return new Response(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dias-protection.vcf"',
    },
  });
}
