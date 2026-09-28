import Image from "next/image";

import { HeroIn } from "./Reveal";

type Props = {
  label: string;
  title: string;
  lead?: string;
  image?: string;
  children?: React.ReactNode;
};

// Topo das páginas internas: imagem de fundo escurecida + título grande
export function PageHero({ label, title, lead, image, children }: Props) {
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
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-36 md:px-8 md:pb-24 md:pt-48">
        <HeroIn>
          <p className="label">{label}</p>
          <h1 className="t-display mt-4 max-w-[18ch]">{title}</h1>
          {lead && <p className="t-lead mt-6 max-w-[54ch] !text-text/75">{lead}</p>}
          {children}
        </HeroIn>
      </div>
    </section>
  );
}
