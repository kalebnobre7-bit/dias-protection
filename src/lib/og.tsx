import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

// Imagens de prévia (WhatsApp, LinkedIn, Google) geradas no build
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const pub = (...p: string[]) => path.join(process.cwd(), "public", ...p);

async function dataUrl(file: string, mime: string, transform?: (s: string) => string) {
  const buf = await readFile(pub(file));
  const body = transform ? Buffer.from(transform(buf.toString("utf8"))) : buf;
  return `data:${mime};base64,${body.toString("base64")}`;
}

// Inter semibold do Google Fonts; se falhar (sem rede), usa a fonte padrão
async function interSemibold(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@600")).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function renderOg({ eyebrow, title, image }: { eyebrow: string; title: string; image: string }) {
  const [photo, emblem, font] = await Promise.all([
    dataUrl(image, "image/jpeg"),
    dataUrl("brand/emblem.svg", "image/svg+xml", (s) => s.replace(/currentColor/g, "#f2f4f7")),
    interSemibold(),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#07090d" }}>
        <img src={photo} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(7,9,13,0.96) 0%, rgba(7,9,13,0.82) 45%, rgba(7,9,13,0.25) 100%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={emblem} alt="" width={52} height={61} />
            <span style={{ color: "#f2f4f7", fontSize: 28, letterSpacing: "-0.02em" }}>Dias Protection</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
            <span style={{ color: "#8fb3e6", fontSize: 24, textTransform: "uppercase", letterSpacing: "0.08em" }}>{eyebrow}</span>
            <span style={{ color: "#f2f4f7", fontSize: 68, lineHeight: 1.05, letterSpacing: "-0.035em", marginTop: 18 }}>{title}</span>
          </div>
        </div>
      </div>
    ),
    { ...ogSize, fonts: font ? [{ name: "Inter", data: font, weight: 600, style: "normal" }] : undefined },
  );
}
