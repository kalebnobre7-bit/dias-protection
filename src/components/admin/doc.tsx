"use client";

import { Emblem, Wordmark } from "@/components/brand/Logo";
import { RichText } from "@/components/RichText";
import { vehicleCategoryName } from "@/lib/admin/catalog";
import type { AgentRecord, Vehicle } from "@/lib/admin/types";

// Peças dos documentos A4 do painel (proposta e currículo): folha branca, prontas para imprimir em PDF

// Fundo cinza neutro (como um visualizador de PDF); some na impressão
export function DocShell({ children, toolbar }: { children: React.ReactNode; toolbar?: React.ReactNode }) {
  return (
    <div className="doc-page min-h-dvh bg-[#e9ebee] print:bg-white">
      {toolbar && (
        <div className="sticky top-0 z-10 border-b border-line bg-ink/90 backdrop-blur-[16px] print:hidden">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 md:px-8">{toolbar}</div>
        </div>
      )}
      <div className="px-4 py-8 md:px-8 md:py-12 print:p-0">{children}</div>
    </div>
  );
}

export function DocSheet({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <article
      className={`doc-sheet mx-auto w-full max-w-[210mm] bg-white text-[#141922] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] print:max-w-none print:shadow-none ${className}`}
    >
      <div className="px-[14mm] py-[14mm] md:px-[18mm] md:py-[16mm]">{children}</div>
    </article>
  );
}

export function DocLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#141922]/55 ${className}`}>{children}</h2>;
}

// Cabeçalho com a marca e o tipo de documento à direita
export function DocBrandHeader({ kind, children }: { kind: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-6 border-b border-[#141922]/15 pb-6">
      <div className="flex items-center gap-3 text-[#141922]">
        <Emblem className="h-14" />
        <Wordmark className="h-12" />
      </div>
      <div className="text-right">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[#141922]/55">{kind}</p>
        {children}
      </div>
    </header>
  );
}

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function Photo({ src, name, className }: { src: string | null; name: string; className: string }) {
  return src ? (
    <img src={src} alt={name} className={`shrink-0 rounded-lg object-cover ${className}`} />
  ) : (
    <span className={`grid shrink-0 place-items-center rounded-lg bg-[#141922]/8 text-lg font-semibold text-[#141922]/50 ${className}`}>
      {name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")}
    </span>
  );
}

const agentMeta = (a: AgentRecord) =>
  [a.languages.join(", "), a.yearsExperience ? `${a.yearsExperience} anos de experiência` : ""].filter(Boolean).join(" · ");

// Proposta comercial: só apresentação (sem contato nem documentos)
export function AgentCard({ agent: a }: { agent: AgentRecord }) {
  return (
    <div className="flex gap-4 break-inside-avoid">
      <Photo src={a.photoUrl} name={a.name} className="size-[22mm]" />
      <div className="min-w-0 text-[0.875rem] leading-relaxed">
        <p className="text-[1rem] font-semibold">{a.name}</p>
        {a.rolePt && <p className="text-[#141922]/65">{a.rolePt}</p>}
        {agentMeta(a) && <p className="text-[0.8125rem] text-[#141922]/55">{agentMeta(a)}</p>}
        {/* Proposta: bio resumida; o currículo completo vai no serviço fechado */}
        {a.bioPt && <RichText text={a.bioPt} className="mt-1.5 line-clamp-4" />}
      </div>
    </div>
  );
}

export function VehicleCard({ vehicle: v, showPlate = false }: { vehicle: Vehicle; showPlate?: boolean }) {
  const facts = [
    vehicleCategoryName(v.categoryId),
    v.year ? String(v.year) : "",
    v.color,
    v.capacity ? `${v.capacity} lugares` : "",
    v.armored ? "Blindado" : "",
    showPlate && v.plate ? `Placa ${v.plate}` : "",
  ].filter(Boolean);
  return (
    <div className="break-inside-avoid overflow-hidden rounded-lg border border-[#141922]/12">
      {v.photoUrl && <img src={v.photoUrl} alt={v.model} className="aspect-[16/10] w-full object-cover" />}
      <div className="p-3 text-[0.875rem] leading-relaxed">
        <p className="font-semibold">{v.model}</p>
        <p className="text-[0.8125rem] text-[#141922]/60">{facts.join(" · ")}</p>
        {v.descriptionPt && <p className="mt-1">{v.descriptionPt}</p>}
      </div>
    </div>
  );
}

// Currículo completo; contato e CNH só quando o serviço já está fechado
export function AgentCv({ agent: a, withPrivate }: { agent: AgentRecord; withPrivate: boolean }) {
  const career = lines(a.career);
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-6">
        <Photo src={a.photoUrl} name={a.name} className="size-[32mm]" />
        <div className="min-w-0">
          <p className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em]">{a.name}</p>
          {a.rolePt && <p className="mt-1 text-[1rem] text-[#141922]/70">{a.rolePt}</p>}
          {agentMeta(a) && <p className="mt-1 text-[0.875rem] text-[#141922]/55">{agentMeta(a)}</p>}
        </div>
      </div>

      {a.bioPt && (
        <section>
          <DocLabel>Perfil</DocLabel>
          <RichText text={a.bioPt} className="mt-2 text-[0.9375rem] leading-relaxed" />
        </section>
      )}

      {career.length > 0 && (
        <section>
          <DocLabel>Experiência profissional</DocLabel>
          <ul className="mt-2 space-y-1.5 text-[0.9375rem] leading-relaxed">
            {career.map((c, i) => (
              <li key={i} className="border-b border-[#141922]/10 pb-1.5 last:border-0">
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}

      {a.certifications.length > 0 && (
        <section>
          <DocLabel>Certificações</DocLabel>
          <ul className="mt-2 grid gap-x-8 gap-y-1.5 text-[0.9375rem] sm:grid-cols-2">
            {a.certifications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      {withPrivate && (a.phone || a.documentId) && (
        <section>
          <DocLabel>Contato e documento</DocLabel>
          <dl className="mt-2 grid gap-x-8 gap-y-1 text-[0.9375rem] sm:grid-cols-2">
            {a.phone && (
              <div>
                <dt className="text-[0.8125rem] text-[#141922]/55">Telefone</dt>
                <dd>{a.phone}</dd>
              </div>
            )}
            {a.documentId && (
              <div>
                <dt className="text-[0.8125rem] text-[#141922]/55">Documento</dt>
                <dd>{a.documentId}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {withPrivate && a.cnhUrl && (
        <section className="break-inside-avoid">
          <DocLabel>CNH</DocLabel>
          <img src={a.cnhUrl} alt={`CNH de ${a.name}`} className="mt-3 max-h-[110mm] w-auto max-w-full rounded-lg border border-[#141922]/12" />
        </section>
      )}
    </div>
  );
}
