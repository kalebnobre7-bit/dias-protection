import { getSiteContent } from "@/lib/content";

// Gera o .vcf pra "Salvar contato" no celular
export async function GET(request: Request) {
  const { company } = await getSiteContent();
  const origin = new URL(request.url).origin;
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
    `URL:${origin}/pt`,
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
