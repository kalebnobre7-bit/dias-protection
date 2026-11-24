"use client";

import { useEffect, useState } from "react";

import { Emblem, Wordmark } from "@/components/brand/Logo";
import { formatDate, formatDoc, jobDatesText } from "@/lib/admin/labels";
import { getBrowserClient } from "@/lib/supabase";

type Person = { name: string; role: string | null; kind: "agent" | "driver"; photoUrl: string | null; documentId: string | null; cnhUrl: string | null };
type Car = { model: string; plate: string | null; color: string | null; photoUrl: string | null };
type Share = { expiresAt: string; startsAt: string; endsAt: string | null; days: string[]; team: Person[]; vehicles: Car[] };

// Data local de São Paulo ("YYYY-MM-DD") de um timestamptz
const localDay = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }) : "");
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Marca d'água repetida sobre a página e as imagens: desestimula print e reuso fora do credenciamento
function Watermark({ text }: { text: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <div className="absolute -inset-1/2 flex rotate-[-24deg] flex-wrap content-start gap-x-10 gap-y-12 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-white/[0.07]">
        {Array.from({ length: 120 }, (_, i) => (
          <span key={i}>{text}</span>
        ))}
      </div>
    </div>
  );
}

function Initials({ name }: { name: string }) {
  return (
    <span className="grid size-20 shrink-0 place-items-center rounded-lg bg-white/8 text-lg font-semibold text-silver">
      {name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")}
    </span>
  );
}

// Página aberta pela portaria a partir do link gerado no serviço (?t=código). Rota estática: os dados
// vêm da função credential_share, que só responde com código válido, dentro do prazo e não revogado.
export default function CredentialPage() {
  const [share, setShare] = useState<Share | null | "loading">("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("t") ?? "";
    if (!uuid.test(token)) {
      setShare(null);
      return;
    }
    getBrowserClient()
      .rpc("credential_share", { p_token: token })
      .then(({ data, error }) => setShare(error ? null : ((data as Share | null) ?? null)));
  }, []);

  if (share === "loading") return <div className="min-h-dvh bg-ink" />;

  if (!share) {
    return (
      <main className="grid min-h-dvh place-items-center bg-ink px-4 text-center">
        <div className="max-w-sm space-y-2">
          <p className="text-lg font-semibold">Link expirado ou inválido</p>
          <p className="text-[0.9375rem] text-muted">Peça um novo link de credenciamento à Dias Protection.</p>
        </div>
      </main>
    );
  }

  const dates = jobDatesText({ days: share.days, startsAt: localDay(share.startsAt), endsAt: localDay(share.endsAt) });
  const mark = `Uso exclusivo para credenciamento · válido até ${formatDate(share.expiresAt)}`;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink">
      <Watermark text={mark} />
      <div className="relative mx-auto max-w-2xl space-y-8 px-4 py-8 md:py-12">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div className="flex items-center gap-2 text-text">
            <Emblem className="h-12" />
            <Wordmark className="h-11" />
          </div>
          <div className="text-right text-[0.8125rem]">
            <p className="font-semibold uppercase tracking-[0.12em] text-muted">Credenciamento</p>
            <p className="num">Serviço: {dates}</p>
            <p className="num text-muted">Válido até {formatDate(share.expiresAt)}</p>
          </div>
        </header>

        {share.team.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Equipe · {share.team.length}</h2>
            <ul className="space-y-3">
              {share.team.map((p, i) => (
                <li key={i} className="space-y-3 rounded-xl border border-line bg-ink-2/80 p-4">
                  <div className="flex gap-4">
                    {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="size-20 shrink-0 rounded-lg object-cover" /> : <Initials name={p.name} />}
                    <div className="min-w-0 text-[0.9375rem]">
                      <p className="text-lg font-semibold leading-tight">{p.name}</p>
                      <p className="text-muted">{p.role || (p.kind === "driver" ? "Motorista" : "Agente de segurança")}</p>
                      {p.documentId && <p className="num mt-1">Documento: {formatDoc(p.documentId)}</p>}
                    </div>
                  </div>
                  {p.cnhUrl && (
                    <figure className="relative overflow-hidden rounded-lg">
                      <img src={p.cnhUrl} alt={`CNH de ${p.name}`} className="w-full" />
                      <figcaption className="absolute inset-0 grid place-items-center text-center text-sm font-semibold uppercase tracking-[0.1em] text-black/30 [text-shadow:0_0_2px_rgb(255_255_255/0.6)]">
                        {mark}
                      </figcaption>
                    </figure>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {share.vehicles.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Veículos · {share.vehicles.length}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {share.vehicles.map((v, i) => (
                <li key={i} className="overflow-hidden rounded-xl border border-line bg-ink-2/80">
                  {v.photoUrl && <img src={v.photoUrl} alt={v.model} className="aspect-[16/10] w-full object-cover" />}
                  <div className="p-3 text-[0.9375rem]">
                    <p className="font-semibold">{v.model}</p>
                    <p className="text-muted">{[v.color, v.plate && `Placa ${v.plate}`].filter(Boolean).join(" · ")}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="border-t border-line pt-4 text-[0.75rem] text-muted">
          Dados pessoais compartilhados só para o credenciamento deste serviço (LGPD). Não reenvie nem guarde cópias.
        </p>
      </div>
    </main>
  );
}
