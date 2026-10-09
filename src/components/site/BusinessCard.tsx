"use client";

import Image from "next/image";
import { AtSign, Mail, Phone } from "lucide-react";
import { useState } from "react";

import { Emblem, Wordmark } from "@/components/brand/Logo";
import { InstagramIcon, LinkedInIcon, WhatsAppIcon } from "@/components/brand/SocialIcons";

type Props = {
  name: string;
  role: string;
  tagline: string;
  photo: string;
  phone: string;
  email: string;
  instagram: string;
  qr: { size: number; d: string };
  labels: { flip: string };
};

// Prata metálica do hot stamping do cartão impresso
const FOIL = "linear-gradient(135deg,#7d8796 0%,#dde3ea 28%,#a3aebc 50%,#f4f6f9 72%,#8a95a4 100%)";

// Réplica do cartão impresso (versão marinho, 90×50 mm): frente com a marca, verso com contato e QR.
// Posições em cqw medidas na arte do Penpot (1cqw = 0,9 mm), então escala igual de 320px a desktop.
export function BusinessCard(p: Props) {
  const [flipped, setFlipped] = useState(false);

  const face =
    "absolute inset-0 overflow-hidden rounded-[3.5cqw] border border-line-strong backface-hidden shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)]";

  return (
    <div className="[container-type:inline-size] w-full">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={p.labels.flip}
        aria-pressed={flipped}
        className="group block w-full rounded-[3.5cqw] perspective-[1400px] focus-visible:outline-offset-4"
      >
        <span
          className={`relative block aspect-[9/5] w-full transform-3d transition-transform duration-[900ms] ease-[var(--ease-out)] motion-reduce:duration-0 ${
            flipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Frente */}
          <span
            aria-hidden={flipped}
            className={`${face} block bg-[radial-gradient(120%_95%_at_0%_0%,var(--color-navy-2)_0%,#0c121c_45%,var(--color-ink)_100%)] text-left`}
          >
            {/* Coruja gigante tom sobre tom (verniz UV no impresso) */}
            <Emblem className="absolute left-[47.03cqw] top-[-17.34cqw] h-[90.28cqw] text-white/[0.045]" />
            <Sheen />
            <Emblem className="absolute left-[6.39cqw] top-[18.51cqw] h-[13.66cqw]" style={{ backgroundImage: FOIL }} />
            <span className="absolute left-[21.59cqw] top-[20.44cqw] h-[9.78cqw] w-px bg-[linear-gradient(transparent,rgb(169_180_194/0.45),transparent)]" />
            <Wordmark className="absolute left-[25.21cqw] top-[18.43cqw] h-[13.27cqw]" style={{ backgroundImage: FOIL }} />
            <span className="absolute left-[6.67cqw] top-[43.56cqw] h-[0.18cqw] min-h-px w-[86.67cqw]" style={{ backgroundImage: FOIL }} />
            <span className="absolute left-[6.67cqw] top-[46.22cqw] text-[2.33cqw] font-semibold uppercase leading-[1.2] tracking-[0.2em] text-silver/85">
              {p.tagline}
            </span>
          </span>

          {/* Verso */}
          <span
            aria-hidden={!flipped}
            className={`${face} rotate-y-180 block bg-[radial-gradient(120%_95%_at_100%_0%,var(--color-navy-2)_0%,#0c121c_45%,var(--color-ink)_100%)] text-left`}
          >
            <Sheen />
            {/* Foto com anel prata */}
            <span className="absolute left-[6.11cqw] top-[6.33cqw] size-[14.89cqw] rounded-full p-[0.18cqw]" style={{ backgroundImage: FOIL }}>
              <span className="block size-full rounded-full bg-ink" />
            </span>
            <span className="absolute left-[6.67cqw] top-[6.89cqw] size-[13.78cqw] overflow-hidden rounded-full">
              <Image src={p.photo} alt="" fill sizes="96px" className="object-cover object-top" />
            </span>
            <span className="absolute left-[24.44cqw] top-[8.22cqw] whitespace-nowrap text-[5.11cqw] font-semibold leading-[1.1] tracking-[-0.02em] text-text">
              {p.name}
            </span>
            <span className="absolute left-[24.56cqw] top-[15.11cqw] whitespace-nowrap text-[2.78cqw] leading-[1.2] text-silver/85">
              {p.role}
            </span>
            <Emblem className="absolute left-[89.27cqw] top-[7.01cqw] h-[4.86cqw]" style={{ backgroundImage: FOIL }} />
            <span className="absolute left-[6.67cqw] top-[30.44cqw] h-[0.16cqw] min-h-px w-[57.78cqw]" style={{ backgroundImage: FOIL }} />

            {/* Contatos */}
            {[
              { icon: Phone, value: p.phone, top: "36.22cqw", tone: "text-text" },
              { icon: Mail, value: p.email, top: "40.89cqw", tone: "text-text" },
              { icon: AtSign, value: p.instagram, top: "45.56cqw", tone: "text-silver/90" },
            ].map(({ icon: Icon, value, top, tone }) => (
              <span key={value} className="absolute left-[6.67cqw] flex items-center gap-[1.99cqw]" style={{ top }}>
                <Icon className="size-[2.67cqw] text-silver" strokeWidth={1.5} aria-hidden />
                <span className={`num whitespace-nowrap text-[2.89cqw] leading-[1.2] ${tone}`}>{value}</span>
              </span>
            ))}

            {/* QR com moldura prata e placa clara */}
            <span className="absolute left-[70.78cqw] top-[22.44cqw] size-[23.33cqw] rounded-[2.44cqw] p-[0.18cqw]" style={{ backgroundImage: FOIL }}>
              <span className="block size-full rounded-[2.26cqw] bg-ink" />
            </span>
            <span className="absolute left-[71.56cqw] top-[23.22cqw] grid size-[21.78cqw] place-items-center rounded-[1.78cqw] bg-[linear-gradient(135deg,#f6f8fa,#e3e8ee,#f6f8fa)] text-ink">
              <svg viewBox={`0 0 ${p.qr.size} ${p.qr.size}`} className="block size-[17.6cqw]" shapeRendering="crispEdges" aria-hidden>
                <path d={p.qr.d} fill="currentColor" />
              </svg>
            </span>
            <span className="absolute left-[75.78cqw] top-[47.44cqw] flex gap-[2.67cqw] text-silver/85">
              <InstagramIcon className="size-[2.67cqw]" />
              <LinkedInIcon className="size-[2.67cqw]" />
              <WhatsAppIcon className="size-[2.67cqw]" />
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}

// Reflexo prateado discreto, como um cartão laminado
function Sheen() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgb(180_191_204/0.06)_45%,transparent_60%)]"
    />
  );
}
