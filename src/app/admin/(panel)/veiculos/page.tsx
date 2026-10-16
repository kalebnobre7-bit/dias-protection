"use client";

import { useState } from "react";
import { FileText as IconDoc, Plus as IconPlus } from "lucide-react";

import { PhotoInput } from "@/components/admin/PhotoInput";
import { Badge, Button, DeleteButton, EmptyState, Field, List, NumberInput, PageHeader, PickMark, Row, SearchBox, Section, Segmented, Sheet, Skeleton, Switch, TextArea, useForm } from "@/components/admin/ui";
import { vehicleCategoryName, vehicleCategoryOptions } from "@/lib/admin/catalog";
import { newId, repo, useTable } from "@/lib/admin/store";
import type { Vehicle } from "@/lib/admin/types";

const blank = (): Vehicle => ({
  id: newId(),
  categoryId: vehicleCategoryOptions[0]?.value ?? null,
  model: "",
  plate: "",
  color: "",
  year: null,
  owner: "own",
  partnerId: null,
  active: true,
  notes: "",
  published: false,
  photoUrl: null,
  descriptionPt: "",
  descriptionEn: "",
  capacity: null,
  armored: false,
  createdAt: new Date().toISOString(),
});

export default function VehiclesPage() {
  const { rows, loading } = useTable("vehicles");
  const { rows: partners } = useTable("partners");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  // Modo "Exportar PDF": ids escolhidos (null = fora do modo)
  const [picking, setPicking] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");
  const sorted = [...rows].sort((a, b) => Number(b.active) - Number(a.active) || a.model.localeCompare(b.model));
  const q = query.trim().toLowerCase();
  const shown = sorted.filter((v) => !q || `${v.model} ${v.plate} ${v.color} ${vehicleCategoryName(v.categoryId)}`.toLowerCase().includes(q));

  return (
    <>
      <PageHeader
        title="Veículos"
        subtitle="Frota própria e de parceiros. Os publicados aparecem na página Frota do site."
        action={
          picking ? (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setPicking(null)}>
                Cancelar
              </Button>
              <Button disabled={!picking.length} onClick={() => exportPdf(picking)}>
                <IconDoc className="size-4" /> Gerar PDF ({picking.length})
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {rows.length > 0 && (
                <Button variant="secondary" onClick={() => setPicking([])}>
                  <IconDoc className="size-4" /> Exportar PDF
                </Button>
              )}
              <Button onClick={() => setEditing(blank())}>
                <IconPlus className="size-4" /> Novo veículo
              </Button>
            </div>
          )
        }
      />
      {picking && <p className="-mt-4 mb-4 px-1 text-[0.875rem] text-muted">Toque nos veículos que vão no PDF. Sai com foto e descrição, sem a placa.</p>}
      {loading ? (
        <Skeleton />
      ) : !rows.length ? (
        <EmptyState title="Nenhum veículo cadastrado" />
      ) : (
        <>
          <SearchBox value={query} onChange={setQuery} placeholder="Buscar por modelo, placa ou categoria" />
          {shown.length ? (
            <List>
              {shown.map((v) => (
                <Row
                  key={v.id}
                  onClick={() => (picking ? setPicking(picking.includes(v.id) ? picking.filter((x) => x !== v.id) : [...picking, v.id]) : setEditing(v))}
                  title={v.model}
                  subtitle={[vehicleCategoryName(v.categoryId), v.plate, v.color, v.year].filter(Boolean).join(" · ")}
                  trailing={
                    picking ? (
                      <PickMark on={picking.includes(v.id)} />
                    ) : (
                      <span className="flex flex-col items-end gap-1">
                        {!v.active ? <Badge tone="bad">Inativo</Badge> : v.published ? <Badge tone="good">No site</Badge> : null}
                        <Badge tone={v.owner === "own" ? "accent" : "neutral"}>
                          {v.owner === "own" ? "Própria" : partners.find((p) => p.id === v.partnerId)?.name ?? "Parceiro"}
                        </Badge>
                      </span>
                    )
                  }
                />
              ))}
            </List>
          ) : (
            <p className="mt-6 text-center text-muted">Nenhum veículo encontrado.</p>
          )}
        </>
      )}
      {editing && (
        <VehicleSheet
          vehicle={editing}
          isNew={!rows.some((r) => r.id === editing.id)}
          partners={partners.map((p) => ({ value: p.id, label: p.name }))}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

// Abre a apresentação em A4 (sem placa) em outra aba
const exportPdf = (ids: string[]) =>
  window.open(`${process.env.NEXT_PUBLIC_BASE_PATH}/admin/apresentacao?veiculos=${ids.join(",")}`, "_blank", "noopener");

function VehicleSheet(props: { vehicle: Vehicle; isNew: boolean; partners: { value: string; label: string }[]; onClose: () => void }) {
  const { value: v, set, dirty } = useForm(props.vehicle);
  const [error, setError] = useState("");

  const persist = async () => {
    if (!v.model.trim()) {
      setError("Informe o modelo.");
      return false;
    }
    try {
      await repo.upsert("vehicles", { ...v, model: v.model.trim(), partnerId: v.owner === "partner" ? v.partnerId : null });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      return false;
    }
  };
  const save = async () => {
    if (await persist()) props.onClose();
  };
  // Salva e abre a apresentação do veículo em A4 em outra aba
  const openPdf = async () => {
    if (await persist()) exportPdf([v.id]);
  };
  const remove = async () => {
    try {
      await repo.remove("vehicles", v.id);
      props.onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
  };

  return (
    <Sheet
      open
      error={error}
      dirty={dirty}
      onClose={props.onClose}
      title={props.isNew ? "Novo veículo" : v.model || "Veículo"}
      footer={
        <>
          {!props.isNew && <DeleteButton onConfirm={remove} />}
          <Button className="ml-auto" onClick={save}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PhotoInput name={v.model || "Veículo"} folder="vehicles" value={v.photoUrl} onChange={(x) => set("photoUrl", x)} />
        <Button variant="secondary" onClick={openPdf}>
          <IconDoc className="size-4" /> PDF
        </Button>
      </div>
      <Field label="Modelo">
        <input className="input" value={v.model} onChange={(e) => set("model", e.target.value)} autoFocus={props.isNew} placeholder="Ex.: Toyota SW4" />
      </Field>
      <Field label="Categoria no site">
        <select className="input" value={v.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)}>
          {vehicleCategoryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Placa">
          <input className="input num uppercase" maxLength={8} value={v.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} placeholder="ABC1D23" />
        </Field>
        <Field label="Cor">
          <input className="input" value={v.color} onChange={(e) => set("color", e.target.value)} />
        </Field>
        <Field label="Ano">
          <NumberInput value={v.year} onChange={(y) => set("year", y)} digits={4} max={2100} placeholder="2024" label="Ano" />
        </Field>
      </div>
      <Field label="Proprietário">
        <Segmented
          value={v.owner}
          onChange={(o) => set("owner", o)}
          options={[
            { value: "own", label: "Própria" },
            { value: "partner", label: "Parceiro" },
          ]}
        />
      </Field>
      {v.owner === "partner" && (
        <Field label="Parceiro" hint={props.partners.length ? undefined : "Cadastre o parceiro na aba Parceiros."}>
          <select className="input" value={v.partnerId ?? ""} onChange={(e) => set("partnerId", e.target.value || null)}>
            <option value="">Selecione</option>
            {props.partners.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Section title="Página Frota do site">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lugares">
              <NumberInput value={v.capacity} onChange={(c) => set("capacity", c)} digits={2} min={1} max={99} suffix="lugares" label="Lugares" />
            </Field>
            <div className="rounded-xl border border-line px-4 py-1">
              <Switch checked={v.armored} onChange={(x) => set("armored", x)} label="Blindado" />
            </div>
          </div>
          <Field label="Descrição (PT)">
            <TextArea rows={3} value={v.descriptionPt} onChange={(e) => set("descriptionPt", e.target.value)} placeholder="Ex.: Vidros escurecidos, bancos em couro, Wi-Fi." />
          </Field>
          <Field label="Descrição (EN)">
            <TextArea rows={3} value={v.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
          </Field>
        </div>
      </Section>
      <div className="rounded-xl border border-line px-4 py-2">
        <Switch checked={v.active} onChange={(x) => set("active", x)} label="Ativo" hint="Inativos não aparecem ao montar um serviço" />
        <div className="border-t border-line" />
        <Switch checked={v.published} onChange={(x) => set("published", x)} label="Mostrar no site" hint="Foto, modelo, ano, lugares e descrição. A placa nunca aparece. Depois, publique na aba Site." />
      </div>
      <Field label="Observações">
        <TextArea rows={2} value={v.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
    </Sheet>
  );
}
