"use client";

import { Copy as IconCopy, Link2 as IconLink } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Section } from "@/components/admin/ui";
import { formatDate, formatDateTime } from "@/lib/admin/labels";
import { defaultDueDate } from "@/lib/admin/overtime";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { Job, ShareLink } from "@/lib/admin/types";

const linkUrl = (id: string) => `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/credenciamento/?t=${id}`;
const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

// Link com validade para a portaria credenciar a equipe e os veículos do serviço (sem PDF solto)
export function JobShareLinks({ job }: { job: Job }) {
  const { rows } = useTable("shareLinks");
  const links = rows.filter((l) => l.jobId === job.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // Padrão: dia seguinte ao fim do serviço (serviço já passado: hoje)
  const [expiresAt, setExpiresAt] = useState(() => [defaultDueDate(job, 1), today()].sort()[1]);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(linkUrl(id));
      setCopied(id);
    } catch {
      setError("Não deu para copiar. Abra o link e copie da barra de endereço.");
    }
  };
  const run = async (work: () => Promise<unknown>) => {
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };
  const create = () =>
    run(async () => {
      const id = newId();
      await repo.upsert("shareLinks", { id, jobId: job.id, expiresAt, revoked: false, views: 0, lastViewAt: "", createdAt: new Date().toISOString() });
      await copy(id);
    });
  const revoke = (l: ShareLink) => run(() => repo.upsert("shareLinks", { ...l, revoked: true }));

  return (
    <Section title="Link de credenciamento">
      <div className="space-y-3">
        <p className="text-[0.8125rem] text-muted">
          Para a portaria do evento ou condomínio: foto, nome, função e documento da equipe salva neste serviço (CNH só dos motoristas) e modelo, cor e placa dos veículos. Sem telefone.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
          <label className="flex items-center gap-2">
            <span className="text-muted">Válido até</span>
            <input className="input !min-h-9 !w-40" type="date" min={today()} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </label>
          <Button variant="secondary" className="!min-h-9" onClick={create} disabled={!expiresAt}>
            <IconLink className="size-4" /> Gerar e copiar link
          </Button>
        </div>
        {error && <p className="text-[0.8125rem] text-danger">{error}</p>}
        {links.length > 0 && (
          <ul className="divide-y divide-line border-y border-line">
            {links.map((l) => {
              const expired = l.expiresAt < today();
              const active = !l.revoked && !expired;
              return (
                <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[0.8125rem]">
                  <Badge tone={active ? "good" : "neutral"}>{l.revoked ? "Revogado" : expired ? "Expirado" : `Vale até ${formatDate(l.expiresAt)}`}</Badge>
                  <span className="flex-1 text-muted">
                    {l.views ? `Aberto ${l.views} ${l.views === 1 ? "vez" : "vezes"} · último em ${formatDateTime(new Date(l.lastViewAt).toLocaleString("sv-SE").replace(" ", "T"))}` : "Ainda não aberto"}
                  </span>
                  {active && (
                    <span className="flex gap-1">
                      <Button variant="ghost" className="!min-h-9 !px-3" onClick={() => copy(l.id)}>
                        <IconCopy className="size-4" /> {copied === l.id ? "Copiado" : "Copiar"}
                      </Button>
                      <Button variant="ghost" className="!min-h-9 !px-3 text-danger" onClick={() => revoke(l)}>
                        Revogar
                      </Button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Section>
  );
}
