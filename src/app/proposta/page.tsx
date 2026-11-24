"use client";

import { MessageCircle as IconChat, Printer as IconPrint } from "lucide-react";
import { useEffect, useState } from "react";

import { DocShell, type DocAgent, type DocVehicle } from "@/components/admin/doc";
import { ProposalDocument, type DocClient, type DocCompany } from "@/components/admin/ProposalDocument";
import { localContent } from "@/data/content";
import { DOC_LABELS, docDate, type DocLang } from "@/lib/admin/proposal-i18n";
import { DEFAULT_SETTINGS } from "@/lib/admin/settings";
import type { Proposal, ProposalItem, Settings } from "@/lib/admin/types";
import { getBrowserClient } from "@/lib/supabase";

// Resposta da função proposal_share (colunas vazias chegam como null)
type Raw = Record<string, unknown>;
type Share = { proposal: Proposal; categories: Record<string, string> | null; client: DocClient | null; language: DocLang; team: DocAgent[]; fleet: DocVehicle[]; company: DocCompany };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const numOrNull = (v: unknown) => (v == null ? null : num(v));
const strOrNull = (v: unknown) => (typeof v === "string" && v ? v : null);
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const obj = (v: unknown): Raw => (v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : {});
const list = (v: unknown): Raw[] => (Array.isArray(v) ? v.map(obj) : []);
// Data local de São Paulo ("YYYY-MM-DD") de um timestamptz
const localDay = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

const COPY = {
  pt: {
    save: "Salvar PDF",
    questions: "Tenho dúvidas",
    ask: (n: string) => `Olá! Tenho dúvidas sobre a proposta ${n}.`,
    acceptHint: "Para aceitar, digite seu nome completo.",
    name: "Nome completo",
    accept: "Aceitar proposta",
    sending: "Enviando…",
    failed: "Não deu para registrar o aceite. Tente de novo ou fale com a gente no WhatsApp.",
    accepted: (name: string, date: string) => `Aceita por ${name} em ${date}`,
    invalid: "Link expirado ou inválido",
    invalidHint: "Peça um novo link da proposta à Dias Protection.",
  },
  en: {
    save: "Save PDF",
    questions: "I have questions",
    ask: (n: string) => `Hello! I have some questions about proposal ${n}.`,
    acceptHint: "To accept, type your full name.",
    name: "Full name",
    accept: "Accept proposal",
    sending: "Sending…",
    failed: "We couldn't record your acceptance. Please try again or reach us on WhatsApp.",
    accepted: (name: string, date: string) => `Accepted by ${name} on ${date}`,
    invalid: "Expired or invalid link",
    invalidHint: "Ask Dias Protection for a new proposal link.",
  },
} as const;

// Monta a proposta do documento a partir da resposta; o que é interno fica em branco
function parse(data: Raw): Share {
  const p = obj(data.proposal);
  const c = data.client ? obj(data.client) : null;
  const items: ProposalItem[] = list(p.items).map((i) => ({
    id: str(i.id),
    description: str(i.description),
    detail: str(i.detail),
    qty: num(i.qty),
    unit: str(i.unit),
    unitPrice: num(i.unitPrice),
  }));
  const proposal: Proposal = {
    id: "",
    number: str(p.number),
    clientId: null,
    jobId: null,
    title: str(p.title),
    status: (str(p.status) || "sent") as Proposal["status"],
    issuedAt: str(p.issuedAt),
    validUntil: str(p.validUntil),
    serviceIds: strs(p.serviceIds),
    summary: str(p.summary),
    period: str(p.period),
    startDate: str(p.startDate),
    endDate: str(p.endDate),
    days: strs(p.days),
    en: obj(p.en) as Record<string, string>,
    nature: str(p.nature) as Proposal["nature"],
    guards: num(p.guards),
    location: str(p.location),
    items,
    agentIds: [],
    vehicleIds: [],
    discount: num(p.discount),
    paymentTerms: str(p.paymentTerms),
    terms: str(p.terms),
    notes: "",
    pricing: null,
    acceptedName: str(p.acceptedName),
    acceptedAt: str(p.acceptedAt),
    createdAt: "",
  };
  const team: DocAgent[] = list(data.team).map((a) => ({
    id: str(a.id),
    name: str(a.name),
    rolePt: str(a.rolePt),
    roleEn: str(a.roleEn),
    bioPt: str(a.bioPt),
    bioEn: str(a.bioEn),
    languages: strs(a.languages),
    yearsExperience: numOrNull(a.yearsExperience),
    photoUrl: strOrNull(a.photoUrl),
  }));
  const fleet: DocVehicle[] = list(data.fleet).map((v) => ({
    id: str(v.id),
    model: str(v.model),
    categoryId: strOrNull(v.categoryId),
    year: numOrNull(v.year),
    color: str(v.color),
    capacity: numOrNull(v.capacity),
    armored: v.armored === true,
    descriptionPt: str(v.descriptionPt),
    descriptionEn: str(v.descriptionEn),
    photoUrl: strOrNull(v.photoUrl),
    photos: strs(v.photos),
  }));
  // Marca fixa do site; contato e assinatura vêm de Configurações
  const company: DocCompany = {
    ...DEFAULT_SETTINGS.company,
    ...(obj(data.company) as Partial<Settings["company"]>),
    brandName: localContent.company.brandName,
    tagline: localContent.company.tagline,
  };
  const categories = data.categories ? (obj(data.categories) as Record<string, string>) : null;
  // Sem e-mail, telefone nem representantes: o link não expõe contato do cliente
  const client: DocClient | null = c ? { name: str(c.name), company: str(c.company), email: "", phone: "", representatives: [] } : null;
  return { proposal, categories, client, language: c?.language === "en" ? "en" : "pt", team, fleet, company };
}

// Página aberta pelo cliente a partir do link gerado na proposta (?t=código). Rota estática: os dados
// vêm da função proposal_share, que só responde com código válido, dentro do prazo e não revogado.
export default function ProposalLinkPage() {
  const [share, setShare] = useState<Share | null | "loading">("loading");
  const [token, setToken] = useState("");
  const [langChoice, setLangChoice] = useState<DocLang | null>(null);
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t") ?? "";
    if (!uuid.test(t)) {
      setShare(null);
      return;
    }
    setToken(t);
    getBrowserClient()
      .rpc("proposal_share", { p_token: t })
      .then(({ data, error }) => setShare(error || !data ? null : parse(obj(data))));
  }, []);

  if (share === "loading") return <div className="min-h-dvh bg-[#e9ebee]" />;

  if (!share) {
    // Sem a proposta não dá para saber o idioma do cliente: português e inglês juntos
    return (
      <main className="grid min-h-dvh place-items-center bg-ink px-4 text-center">
        <div className="max-w-sm space-y-2">
          <p className="text-lg font-semibold">{COPY.pt.invalid}</p>
          <p className="text-[0.9375rem] text-muted">{COPY.pt.invalidHint}</p>
          <p className="pt-3 text-[0.8125rem] text-muted">
            {COPY.en.invalid} · {COPY.en.invalidHint}
          </p>
        </div>
      </main>
    );
  }

  const { proposal: p, company } = share;
  const lang: DocLang = langChoice ?? share.language;
  const copy = COPY[lang];
  const t = DOC_LABELS[lang];
  const canAccept = !p.acceptedAt && (p.status === "draft" || p.status === "sent");

  async function accept(e: React.FormEvent) {
    e.preventDefault();
    if (sending || name.trim().length < 3 || share === null || share === "loading") return;
    setSending(true);
    setFailed(false);
    const { data, error } = await getBrowserClient().rpc("accept_proposal", { p_token: token, p_name: name });
    setSending(false);
    const res = obj(data);
    if (error || !res.acceptedAt) {
      setFailed(true);
      return;
    }
    setShare({ ...share, proposal: { ...share.proposal, status: "accepted", acceptedName: str(res.acceptedName), acceptedAt: str(res.acceptedAt) } });
  }

  // Coluna do cliente enquanto não aceitou: nome digitado vira a assinatura; impresso sai a linha em branco
  const acceptance = canAccept ? (
    <div>
      <form onSubmit={accept} className="space-y-3 print:hidden">
        <p className="text-[#141922]/60">{copy.acceptHint}</p>
        <div className="flex min-h-14 items-end border-b border-[#141922]/40 pb-1">
          <span className="font-[family-name:var(--font-signature)] text-[2.5rem] leading-[1.3] text-[#141922]/85">{name}</span>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={copy.name}
          aria-label={copy.name}
          autoComplete="name"
          maxLength={120}
          className="min-h-11 w-full rounded-lg border border-[#141922]/25 bg-white px-3 text-[0.9375rem] text-[#141922] outline-none focus:border-[#141922]/60"
        />
        <button
          type="submit"
          disabled={sending || name.trim().length < 3}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#141922] px-5 text-[0.9375rem] font-medium text-white disabled:opacity-40"
        >
          {sending ? copy.sending : copy.accept}
        </button>
        {failed && <p className="text-[#b42318]">{copy.failed}</p>}
      </form>
      <div className="hidden print:block">
        <div className="min-h-14 border-b border-[#141922]/40" />
        <p className="mt-2 font-medium">{share.client?.name || t.client}</p>
        <p className="text-[#141922]/60">{t.agreed}: ____ / ____ / ________</p>
      </div>
    </div>
  ) : undefined;

  const whatsapp = company.whatsapp && `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(copy.ask(p.number))}`;

  return (
    <DocShell
      toolbar={
        <>
          <span className="text-[0.875rem] text-muted">
            {p.number}
            {p.acceptedAt && ` · ${copy.accepted(p.acceptedName, docDate(localDay(p.acceptedAt), lang))}`}
          </span>
          <div className="inline-flex gap-x-1" role="group" aria-label="Idioma / Language">
            {(["pt", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => setLangChoice(l)}
                className={`min-h-9 border-b-2 px-3 text-[0.875rem] font-medium transition-colors duration-200 ${
                  lang === l ? "border-text text-text" : "border-transparent text-muted hover:text-text"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-[0.9375rem] hover:border-silver"
              >
                <IconChat className="size-4" /> {copy.questions}
              </a>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-text px-5 text-[0.9375rem] font-medium text-ink hover:bg-white"
            >
              <IconPrint className="size-4" /> {copy.save}
            </button>
          </div>
        </>
      }
    >
      <ProposalDocument
        p={p}
        categories={share.categories}
        client={share.client}
        team={share.team}
        fleet={share.fleet}
        company={company}
        lang={lang}
        closed={false}
        acceptance={acceptance}
      />
    </DocShell>
  );
}
