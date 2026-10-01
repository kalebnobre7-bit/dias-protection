import Image from "next/image";

import { HeroIn } from "./Reveal";

type Props = {
  label: string;
  title: string;
  lead?: string;
  image?: string;
  compact?: boolean; // topo curto, para páginas de ação (pedido)
  children?: React.ReactNode;
};

// Topo das páginas internas: imagem de fundo escurecida + título grande
export function PageHero({ label, title, lead, image, compact = false, children }: Props) {
  return (
    <section className="relative isolate overflow-hidden">
      {image ? (
        <>
          <Image src={image} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/75 to-ink/35" />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(100%_80%_at_80%_0%,var(--color-navy-2)_0%,var(--color-ink)_65%)]"
        />
      )}
      <div className={`mx-auto max-w-7xl px-4 md:px-8 ${compact ? "pb-4 pt-28 md:pb-6 md:pt-36" : "pb-12 pt-32 md:pb-16 md:pt-40"}`}>
        <HeroIn>
          <p className="label">{label}</p>
          <h1 className={`${compact ? "t-h2" : "t-display"} mt-4 max-w-[18ch]`}>{title}</h1>
          {lead && <p className={`${compact ? "mt-3 max-w-[60ch] text-muted" : "t-lead mt-6 max-w-[54ch] !text-text/75"}`}>{lead}</p>}
          {children}
        </HeroIn>
      </div>
    </section>
  );
}
