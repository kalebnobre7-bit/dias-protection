"use client";

import { Avatar, EmptyState, List, PageHeader, Row, Section, Skeleton, Switch } from "@/components/admin/ui";
import { vehicleCategoryName } from "@/lib/admin/catalog";
import { repo, useTable } from "@/lib/admin/store";

const site = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH}/pt${path}`;

export default function SitePage() {
  const { rows: agents, loading: agentsLoading } = useTable("agents");
  const { rows: vehicles, loading: vehiclesLoading } = useTable("vehicles");

  const activeAgents = [...agents].filter((a) => a.active && !a.freelance).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const activeVehicles = [...vehicles].filter((v) => v.active).sort((a, b) => a.model.localeCompare(b.model));
  const onSite = { agents: activeAgents.filter((a) => a.published).length, vehicles: activeVehicles.filter((v) => v.published).length };

  return (
    <>
      <PageHeader
        title="Site"
        subtitle="Quem aparece em Equipe e quais veículos aparecem em Frota. Marcou, o site atualiza em até 1 minuto."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted">
          No ar: <span className="num text-text">{onSite.agents}</span> agente(s) e <span className="num text-text">{onSite.vehicles}</span> veículo(s)
        </p>
        <div className="flex gap-2">
          <a href={site("/equipe")} target="_blank" rel="noopener noreferrer" className="link-chevron text-[0.875rem]">
            Ver Equipe
          </a>
          <a href={site("/frota")} target="_blank" rel="noopener noreferrer" className="link-chevron text-[0.875rem]">
            Ver Frota
          </a>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 [&>*]:min-w-0">
        <Section title={`Equipe · ${onSite.agents} no site`}>
          {agentsLoading ? (
            <Skeleton rows={3} />
          ) : activeAgents.length ? (
            <List>
              {activeAgents.map((a) => (
                <Row
                  key={a.id}
                  leading={<Avatar name={a.name} photo={a.photoUrl} />}
                  title={a.name}
                  subtitle={[a.rolePt, a.photoUrl ? null : "sem foto"].filter(Boolean).join(" · ")}
                  trailing={
                    <Switch checked={a.published} onChange={(v) => repo.upsert("agents", { ...a, published: v })} label="No site" compact />
                  }
                />
              ))}
            </List>
          ) : (
            <EmptyState title="Nenhum agente ativo" text="Cadastre a equipe na aba Agentes, com foto, bio e certificações." />
          )}
          <p className="mt-3 px-1 text-[0.8125rem] text-muted">O site mostra nome, função, bio, idiomas, experiência, certificações e foto. Nunca telefone ou documento.</p>
        </Section>

        <Section title={`Frota · ${onSite.vehicles} no site`}>
          {vehiclesLoading ? (
            <Skeleton rows={3} />
          ) : activeVehicles.length ? (
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
                    <Switch checked={v.published} onChange={(x) => repo.upsert("vehicles", { ...v, published: x })} label="No site" compact />
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
    </>
  );
}
