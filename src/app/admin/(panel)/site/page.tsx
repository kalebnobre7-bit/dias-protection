"use client";

import { useEffect, useMemo, useState } from "react";
import { Check as IconCheck, ExternalLink as IconExternal, Globe as IconGlobe, KeyRound as IconKey, UploadCloud as IconPublish } from "lucide-react";

import { Avatar, Badge, Button, EmptyState, Field, List, PageHeader, Row, Section, Switch } from "@/components/admin/ui";
import { vehicleCategoryName } from "@/lib/admin/catalog";
import {
  buildPublished,
  currentPublished,
  isDirty,
  loadSettings,
  publishToGitHub,
  saveSettings,
  type PublishSettings,
} from "@/lib/admin/publish";
import { repo, useTable } from "@/lib/admin/store";

const site = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH}/pt${path}`;

export default function SitePage() {
  const { rows: agents } = useTable("agents");
  const { rows: vehicles } = useTable("vehicles");
  const [settings, setSettings] = useState<PublishSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: true; commitUrl: string; actionsUrl: string } | { ok: false; message: string } | null>(null);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setShowSettings(!s.token);
  }, []);

  const next = useMemo(() => buildPublished(agents, vehicles), [agents, vehicles]);
  const dirty = isDirty(next);
  const live = currentPublished();

  const activeAgents = [...agents].filter((a) => a.active).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const activeVehicles = [...vehicles].filter((v) => v.active).sort((a, b) => a.model.localeCompare(b.model));

  const publish = async () => {
    if (!settings) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await publishToGitHub(next, settings);
      setResult({ ok: true, ...r });
    } catch (e) {
      const msg = e instanceof TypeError ? "Não foi possível falar com o GitHub. Verifique a conexão e tente de novo." : e instanceof Error ? e.message : "Não foi possível publicar.";
      setResult({ ok: false, message: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Site"
        subtitle="Quem aparece em Equipe e quais veículos aparecem em Frota. Marque, confira e publique."
        action={
          <Button onClick={publish} disabled={busy || !settings?.token || (!dirty && !result)}>
            <IconPublish className="size-4" /> {busy ? "Publicando…" : "Publicar no site"}
          </Button>
        }
      />

      {/* Estado: o que está no ar × o que o painel publicaria */}
      <div className={`rounded-2xl border p-5 ${dirty ? "border-[#e8c27a]/40 bg-[#e8c27a]/6" : "border-line bg-navy/60"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">
              {dirty ? "Há alterações ainda não publicadas" : "O site está igual ao painel"}
            </p>
            <p className="mt-1 text-[0.9375rem] text-muted">
              No ar: <span className="num text-text">{live.agents.length}</span> agente(s) e{" "}
              <span className="num text-text">{live.vehicles.length}</span> veículo(s)
              {dirty && (
                <>
                  {" "}
                  · Ao publicar: <span className="num text-text">{next.agents.length}</span> agente(s) e{" "}
                  <span className="num text-text">{next.vehicles.length}</span> veículo(s)
                </>
              )}
              {live.updatedAt && <> · última publicação {new Date(live.updatedAt).toLocaleString("pt-BR")}</>}
            </p>
          </div>
          <div className="flex gap-2">
            <a href={site("/equipe")} target="_blank" rel="noopener noreferrer" className="link-chevron text-[0.875rem]">
              Ver Equipe
            </a>
            <a href={site("/frota")} target="_blank" rel="noopener noreferrer" className="link-chevron text-[0.875rem]">
              Ver Frota
            </a>
          </div>
        </div>
        {result && (
          <p role="status" className={`mt-4 border-t border-line pt-4 text-[0.9375rem] ${result.ok ? "text-[#8fd6a5]" : "text-danger"}`}>
            {result.ok ? (
              <>
                <IconCheck className="mr-1 inline size-4" /> Publicado. O site atualiza em uns 2 minutos.{" "}
                <a href={result.actionsUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Acompanhar deploy <IconExternal className="inline size-3" />
                </a>
              </>
            ) : (
              result.message
            )}
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 [&>*]:min-w-0">
        <Section title={`Equipe · ${next.agents.length} no site`}>
          {activeAgents.length ? (
            <List>
              {activeAgents.map((a) => (
                <Row
                  key={a.id}
                  leading={<Avatar name={a.name} photo={a.photoUrl} />}
                  title={a.name}
                  subtitle={[a.rolePt, a.photoUrl ? null : "sem foto"].filter(Boolean).join(" · ")}
                  trailing={
                    <Switch checked={a.published} onChange={(v) => repo.upsert("agents", { ...a, published: v })} label="No site" />
                  }
                />
              ))}
            </List>
          ) : (
            <EmptyState title="Nenhum agente ativo" text="Cadastre a equipe na aba Agentes, com foto, bio e certificações." />
          )}
          <p className="mt-3 px-1 text-[0.8125rem] text-muted">O site mostra nome, função, bio, idiomas, experiência, certificações e foto. Nunca telefone ou documento.</p>
        </Section>

        <Section title={`Frota · ${next.vehicles.length} no site`}>
          {activeVehicles.length ? (
            <List>
              {activeVehicles.map((v) => (
                <Row
                  key={v.id}
                  leading={
                    v.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.photoUrl} alt="" className="h-10 w-14 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="grid h-10 w-14 shrink-0 place-items-center rounded-lg bg-navy-2 text-xs text-muted">foto</span>
                    )
                  }
                  title={v.model}
                  subtitle={[vehicleCategoryName(v.categoryId), v.year, v.armored ? "blindado" : null].filter(Boolean).join(" · ")}
                  trailing={
                    <Switch checked={v.published} onChange={(x) => repo.upsert("vehicles", { ...v, published: x })} label="No site" />
                  }
                />
              ))}
            </List>
          ) : (
            <EmptyState title="Nenhum veículo ativo" text="Cadastre a frota na aba Veículos, com foto e descrição." />
          )}
          <p className="mt-3 px-1 text-[0.8125rem] text-muted">O site mostra modelo, ano, cor, lugares, blindagem, descrição e foto. Nunca a placa.</p>
        </Section>
      </div>

      <Section
        title="Conexão com o GitHub"
        className="mt-10"
        action={
          <Button variant="ghost" className="!min-h-9 !px-3" onClick={() => setShowSettings((v) => !v)}>
            <IconKey className="size-4" /> {showSettings ? "Ocultar" : settings?.token ? "Conectado" : "Configurar"}
          </Button>
        }
      >
        {showSettings && settings && (
          <div className="space-y-4 rounded-2xl border border-line p-4">
            <p className="text-[0.9375rem] text-muted">
              Publicar grava o arquivo <code className="text-silver">src/data/published.json</code> no repositório e o GitHub Pages republica o site. Crie um{" "}
              <a
                href="https://github.com/settings/personal-access-tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                token fine-grained
              </a>{" "}
              só para este repositório, com a permissão <strong className="text-text">Contents: Read and write</strong>. Ele fica salvo apenas neste navegador.
            </p>
            <Field label="Token">
              <input
                className="input"
                type="password"
                autoComplete="off"
                value={settings.token}
                onChange={(e) => setSettings({ ...settings, token: e.target.value })}
                placeholder="github_pat_…"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Dono">
                <input className="input" value={settings.owner} onChange={(e) => setSettings({ ...settings, owner: e.target.value })} />
              </Field>
              <Field label="Repositório">
                <input className="input" value={settings.repo} onChange={(e) => setSettings({ ...settings, repo: e.target.value })} />
              </Field>
              <Field label="Branch">
                <input className="input" value={settings.branch} onChange={(e) => setSettings({ ...settings, branch: e.target.value })} />
              </Field>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  saveSettings(settings);
                  setShowSettings(false);
                }}
              >
                Salvar conexão
              </Button>
              {settings.token && <Badge tone="good">Token informado</Badge>}
            </div>
          </div>
        )}
        {!showSettings && settings?.token && (
          <p className="px-1 text-[0.9375rem] text-muted">
            <IconGlobe className="mr-1 inline size-4" /> Publicando em {settings.owner}/{settings.repo} ({settings.branch}).
          </p>
        )}
      </Section>
    </>
  );
}
