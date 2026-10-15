"use client";

import { ArrowLeft as IconBack, Printer as IconPrint } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AgentCv, DocBrandHeader, DocSheet, DocShell, VehicleCard } from "@/components/admin/doc";
import { localContent } from "@/data/content";
import { useSession } from "@/lib/admin/auth";
import { formatDateLong } from "@/lib/admin/labels";
import { useTable } from "@/lib/admin/store";

// Apresentação para o cliente em A4: agentes (?agentes=id,id) ou veículos (?veiculos=id,id).
// Sem contato, documento, CNH ou placa.
export default function PresentationPage() {
  const session = useSession();
  const { rows: agents, loading: loadingAgents } = useTable("agents");
  const { rows: vehicles, loading: loadingVehicles } = useTable("vehicles");
  const [query, setQuery] = useState<{ agents: string[]; vehicles: string[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ids = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
    setQuery({ agents: ids("agentes"), vehicles: ids("veiculos") });
  }, []);

  if (session === "loading" || loadingAgents || loadingVehicles || query === null) return <div className="min-h-dvh bg-[#e9ebee]" />;
  if (session === "out") {
    return (
      <DocShell>
        <p className="text-center text-muted">
          Faça login no{" "}
          <Link href="/admin/login" className="text-accent">
            painel
          </Link>{" "}
          para ver este documento.
        </p>
      </DocShell>
    );
  }

  // Mantém a ordem em que foram escolhidos
  const team = query.agents.flatMap((id) => agents.filter((a) => a.id === id));
  const fleet = query.vehicles.flatMap((id) => vehicles.filter((v) => v.id === id));
  const isFleet = fleet.length > 0;

  if (!team.length && !fleet.length) {
    return (
      <DocShell>
        <p className="text-center text-muted">Nada selecionado para exportar.</p>
      </DocShell>
    );
  }

  const { company } = localContent;
  const footer = (
    <footer className="mt-10 border-t border-[#141922]/15 pt-4 text-[0.75rem] text-[#141922]/55">
      {company.brandName} · {company.tagline}
    </footer>
  );

  return (
    <DocShell
      toolbar={
        <>
          <Link
            href={isFleet ? "/admin/veiculos" : "/admin/agentes"}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-[0.9375rem] hover:border-silver"
          >
            <IconBack className="size-4" /> {isFleet ? "Veículos" : "Agentes"}
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-text px-5 text-[0.9375rem] font-medium text-ink hover:bg-white"
          >
            <IconPrint className="size-4" /> Imprimir / Salvar PDF
          </button>
        </>
      }
    >
      {isFleet ? (
        <DocSheet>
          <DocBrandHeader kind={fleet.length > 1 ? "Frota" : "Veículo"} />
          <div className={`mt-8 grid gap-4 ${fleet.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {fleet.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
          {footer}
        </DocSheet>
      ) : (
        // Um currículo por página
        team.map((a, i) => (
          <DocSheet key={a.id} className={i ? "mt-8 print:mt-0 print:break-before-page" : ""}>
            <DocBrandHeader kind={team.length > 1 ? "Equipe" : "Currículo"} />
            <div className="mt-8">
              <AgentCv agent={a} withPrivate={false} />
            </div>
            {footer}
          </DocSheet>
        ))
      )}
      <p className="mx-auto mt-6 max-w-[210mm] text-center text-xs text-muted print:hidden">
        Gerado em {formatDateLong(new Date().toISOString())}. Na janela de impressão, escolha “Salvar como PDF” e desative cabeçalhos e rodapés.
      </p>
    </DocShell>
  );
}
