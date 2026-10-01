import { readFile } from "node:fs/promises";
import path from "node:path";

import { getSiteContent } from "@/lib/content";
import { siteUrl } from "@/lib/site";

// Gerado no build: funciona também no export estático (GitHub Pages)
export const dynamic = "force-static";

// Gera o .vcf pra "Salvar contato" no celular
export async function GET() {
  const { company } = await getSiteContent();
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1");

  // Foto embutida: o contato salvo já aparece com o rosto do Gabriel
  const photo = (await readFile(path.join(process.cwd(), "public", company.founderPhoto))).toString("base64");

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
    fold(`PHOTO;ENCODING=b;TYPE=JPEG:${photo}`),
    "END:VCARD",
  ].join("\r\n");

  return new Response(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dias-protection.vcf"',
    },
  });
}

// vCard pede linhas de até 75 caracteres; a continuação começa com espaço
function fold(line: string): string {
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += 74) parts.push(line.slice(i, i + 74));
  return parts.join("\r\n ");
}
