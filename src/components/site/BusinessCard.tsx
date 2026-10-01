"use client";

import Image from "next/image";
import { useState } from "react";

import { Emblem, Wordmark } from "@/components/brand/Logo";

type Props = {
  name: string;
  role: string;
  tagline: string;
  photo: string;
  phone: string;
  email: string;
  instagram: string;
  qr: { size: number; d: string };
  labels: { flip: string; scan: string };
};

// Cartão físico na tela: frente com a marca, verso com contato e QR. Toque vira.
// Medidas em cqw: o cartão escala inteiro com a largura, de 320px a desktop.
export function BusinessCard(p: Props) {
  const [flipped, setFlipped] = useState(false);

  const face =
    "absolute inset-0 overflow-hidden rounded-[5cqw] border border-line-strong backface-hidden shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)]";

  return (
    <div className="[container-type:inline-size] w-full">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={p.labels.flip}
        aria-pressed={flipped}
        className="group block w-full rounded-[5cqw] perspective-[1400px] focus-visible:outline-offset-4"
      >
        <span
          className={`relative block aspect-[1.586] w-full transform-3d transition-transform duration-[900ms] ease-[var(--ease-out)] motion-reduce:duration-0 ${
            flipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Frente */}
          <span
            aria-hidden={flipped}
            className={`${face} flex flex-col bg-[radial-gradient(120%_90%_at_0%_0%,var(--color-navy-2)_0%,var(--color-ink)_75%)]`}
          >
            <Sheen />
            <span className="flex flex-1 items-center justify-center gap-[6cqw]">
              <Emblem className="h-[30cqw] text-text" />
              <span className="h-[22cqw] w-px bg-line-strong" />
              <Wordmark className="h-[24cqw] text-text" />
            </span>
            <span className="flex items-end justify-between px-[6cqw] pb-[5cqw] text-[3cqw] font-semibold uppercase tracking-[0.16em] text-silver">
              <span>{p.tagline}</span>
              <span aria-hidden className="text-muted transition-transform duration-500 group-hover:translate-x-0.5">
                ↻
              </span>
            </span>
          </span>

          {/* Verso */}
          <span
            aria-hidden={!flipped}
            className={`${face} rotate-y-180 flex flex-col justify-between bg-[radial-gradient(120%_90%_at_100%_0%,var(--color-navy-2)_0%,var(--color-ink)_75%)] p-[6cqw] text-left`}
          >
            <Sheen />
            <span className="flex items-center gap-[4cqw]">
              <span className="relative size-[15cqw] shrink-0 overflow-hidden rounded-full border border-line-strong">
                <Image src={p.photo} alt="" fill sizes="96px" className="object-cover object-top" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[5.4cqw] font-semibold leading-tight tracking-[-0.02em]">{p.name}</span>
                <span className="mt-[0.6cqw] block truncate text-[3.4cqw] text-muted">{p.role}</span>
              </span>
            </span>

            <span className="flex items-end justify-between gap-[4cqw]">
              <span className="num min-w-0 space-y-[1.2cqw] text-[3.4cqw] leading-tight">
                <span className="block truncate">{p.phone}</span>
                <span className="block truncate">{p.email}</span>
                <span className="block truncate text-muted">@{p.instagram}</span>
              </span>
              <span className="flex shrink-0 flex-col items-center gap-[1.2cqw]">
                <span className="block rounded-[2cqw] bg-text p-[1.6cqw] text-ink">
                  <svg
                    viewBox={`0 0 ${p.qr.size} ${p.qr.size}`}
                    className="block size-[22cqw]"
                    shapeRendering="crispEdges"
                    aria-hidden
                  >
                    <path d={p.qr.d} fill="currentColor" />
                  </svg>
                </span>
                <span className="text-[2.4cqw] font-semibold uppercase tracking-[0.14em] text-muted">{p.labels.scan}</span>
              </span>
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
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgb(180_191_204/0.08)_45%,transparent_60%)]"
    />
  );
}
