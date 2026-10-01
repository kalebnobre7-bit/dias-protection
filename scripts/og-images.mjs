// Gera as imagens de prévia (WhatsApp, LinkedIn, Google) em public/og/*.jpg.
// JPG de 1200×630 com nome fixo e ~100 KB: o WhatsApp ignora imagens sem extensão
// ou acima de ~300 KB, que era o caso das geradas pelo Next no export estático.
//
// Uso (precisa do Chromium do Playwright e do sharp, que já vem com o Next):
//   node --experimental-strip-types --no-warnings scripts/og-images.mjs
// Os arquivos gerados são commitados; rode de novo só quando mudar textos ou fotos.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const sharp = require(path.join(root, "node_modules/sharp"));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "/opt/node-tools/node_modules/playwright/index.mjs");

const { getDictionary } = await import(path.join(root, "src/i18n/dictionaries.ts"));
const { localContent } = await import(path.join(root, "src/data/content.ts"));

const W = 1200;
const H = 630;
const out = path.join(root, "public/og");
await mkdir(out, { recursive: true });

const svg = async (file) => {
  const s = (await readFile(path.join(root, "public", file), "utf8")).replace(/currentColor/g, "#f2f4f7");
  return `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;
};
const jpg = async (file) => `data:image/jpeg;base64,${(await readFile(path.join(root, "public", file))).toString("base64")}`;

const emblem = await svg("brand/emblem.svg");
const wordmark = await svg("brand/wordmark.svg");

// Uma imagem por página e idioma: chave = caminho sem barras ("home" para a raiz)
function pages(locale) {
  const dict = getDictionary(locale);
  const { company, serviceTypes } = localContent;
  const brand = "Dias Protection";
  return [
    { key: "home", eyebrow: dict.home.eyebrow, title: dict.home.title, image: "images/hero-suv.jpg" },
    { key: "servicos", eyebrow: `${dict.services.label} · ${brand}`, title: dict.services.title, image: "images/hotel.jpg" },
    ...serviceTypes.map((s) => ({ key: `servicos-${s.id}`, eyebrow: `${dict.services.label} · ${brand}`, title: s.name[locale], image: s.image.slice(1) })),
    { key: "sobre", eyebrow: `${dict.about.label} · ${brand}`, title: dict.about.title, image: "images/gabriel.jpg", portrait: true },
    { key: "equipe", eyebrow: `${dict.team.label} · ${brand}`, title: dict.team.title, image: "images/agent.jpg" },
    { key: "frota", eyebrow: `${dict.fleet.label} · ${brand}`, title: dict.fleet.title, image: "images/convoy.jpg" },
    { key: "solicitar", eyebrow: `${dict.order.label} · ${brand}`, title: dict.order.title, image: "images/airport.jpg" },
    { key: "cartao", eyebrow: company.founderRole[locale], title: company.founderName, image: "images/gabriel.jpg", portrait: true },
  ];
}

// portrait: foto em painel à direita (retrato não cabe em 1200×630 sem cortar o rosto)
function html({ eyebrow, title, photo, focus = "center", portrait = false }) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #07090d; }
  body { font-family: Inter, "Helvetica Neue", Arial, sans-serif; color: #f2f4f7; position: relative; }
  .photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: ${focus}; }
  .portrait .photo { inset: auto 72px auto auto; top: 60px; width: 400px; height: 510px; border-radius: 28px; object-position: top; box-shadow: 0 30px 80px rgba(0,0,0,.6); }
  .portrait .shade { background: radial-gradient(90% 80% at 0% 0%, #192436 0%, #07090d 70%); }
  .portrait .shade2 { display: none; }
  .portrait .box { z-index: 1; }
  .portrait .title { max-width: 600px; font-size: 64px; }
  .portrait .foot span:last-child { display: none; }
  .shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(7,9,13,.96) 0%, rgba(7,9,13,.84) 42%, rgba(7,9,13,.28) 100%); }
  .shade2 { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(7,9,13,.55) 0%, rgba(7,9,13,0) 45%); }
  .box { position: absolute; inset: 0; padding: 60px 72px; display: flex; flex-direction: column; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 18px; }
  .brand img { height: 60px; width: auto; }
  .brand .wm { height: 50px; }
  .sep { width: 1px; height: 44px; background: rgba(169,180,194,.4); }
  .eyebrow { color: #8fb3e6; font-size: 23px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
  .title { font-size: 70px; font-weight: 600; line-height: 1.04; letter-spacing: -.035em; margin-top: 16px; max-width: 800px; text-wrap: balance; }
  .foot { display: flex; align-items: center; justify-content: space-between; color: #b4bfcc; font-size: 22px; font-weight: 500; letter-spacing: -.01em; }
</style></head><body class="${portrait ? "portrait" : ""}">
<div class="shade"></div><div class="shade2"></div>
<img class="photo" src="${photo}">
<div class="box">
  <div class="brand"><img src="${emblem}"><span class="sep"></span><img class="wm" src="${wordmark}"></div>
  <div><div class="eyebrow">${eyebrow}</div><div class="title">${title}</div></div>
  <div class="foot"><span>São Paulo · Brasil</span><span>Protection is our business</span></div>
</div>
</body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const photos = new Map();

for (const locale of ["pt", "en"]) {
  for (const p of pages(locale)) {
    if (!photos.has(p.image)) photos.set(p.image, await jpg(p.image));
    await page.setContent(html({ ...p, photo: photos.get(p.image) }), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png" });
    const file = path.join(out, `${p.key}-${locale}.jpg`);
    await writeFile(file, await sharp(png).jpeg({ quality: 80, mozjpeg: true }).toBuffer());
    const kb = Math.round((await readFile(file)).length / 1024);
    console.log(`${p.key}-${locale}.jpg  ${kb} KB`);
  }
}
await browser.close();
