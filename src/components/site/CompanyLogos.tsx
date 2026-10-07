import type { CSSProperties } from "react";

import { Stagger, StaggerItem } from "@/components/site/Reveal";

type Company = { name: string; logo?: string; scale?: number };

// Logos em prata uniforme; a cor original aparece no hover. Sem `logo` vira texto.
export function CompanyLogos({ items, size = "md", className = "" }: { items: Company[]; size?: "sm" | "md"; className?: string }) {
  const sm = size === "sm";
  return (
    <Stagger as="ul" className={className}>
      {items.map(({ name, logo, scale = 1 }) => (
        <StaggerItem
          as="li"
          key={name}
          className={`font-semibold tracking-[-0.02em] text-silver/70 ${sm ? "text-base md:text-lg" : "text-xl md:text-2xl"}`}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_PATH}${logo}`}
              alt={name}
              loading="lazy"
              style={{ "--scale": scale } as CSSProperties}
              className={`w-auto opacity-60 transition-[opacity,filter] duration-300 ease-[var(--ease-in-out)] [filter:brightness(0)_invert(1)] hover:opacity-100 hover:[filter:none] ${
                sm ? "h-[calc(1.25rem*var(--scale))] sm:h-[calc(1.5rem*var(--scale))]" : "h-[calc(1.625rem*var(--scale))] sm:h-[calc(2rem*var(--scale))]"
              }`}
            />
          ) : (
            name
          )}
        </StaggerItem>
      ))}
    </Stagger>
  );
}
