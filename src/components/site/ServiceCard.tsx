import Image from "next/image";
import Link from "next/link";

import type { Locale, ServiceType } from "@/lib/types";

type Props = { service: ServiceType; locale: Locale; cta: string; featured?: boolean };

// Card do bento: o destaque ocupa mais área e põe o texto sobre a imagem
export function ServiceCard({ service, locale, cta, featured = false }: Props) {
  if (featured) {
    return (
      <Link
        href={`/${locale}/servicos/${service.id}`}
        className="tile lift group relative isolate flex h-full min-h-[26rem] flex-col justify-end p-7 md:p-10"
      >
        <Image
          src={service.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="media-zoom -z-20 object-cover"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <h3 className="t-display max-w-[14ch] !text-[clamp(2rem,3.6vw,3.25rem)]">{service.name[locale]}</h3>
        <p className="mt-4 max-w-[44ch] text-text/80">{service.summary[locale]}</p>
        <span className="link-chevron mt-6">{cta}</span>
      </Link>
    );
  }

  return (
    <Link href={`/${locale}/servicos/${service.id}`} className="tile lift group flex h-full flex-col">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={service.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="media-zoom object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <h3 className="t-h3">{service.name[locale]}</h3>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{service.summary[locale]}</p>
        <span className="link-chevron mt-auto pt-5 text-[0.9375rem]">{cta}</span>
      </div>
    </Link>
  );
}
