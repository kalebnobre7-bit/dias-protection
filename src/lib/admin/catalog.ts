import { localContent } from "@/data/content";

// Tipos de serviço e categorias de veículo vêm do conteúdo do site (em PT)
export const serviceTypeOptions = [...localContent.serviceTypes]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((s) => ({ value: s.id, label: s.name.pt }));

export const vehicleCategoryOptions = [...localContent.vehicleCategories]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((c) => ({ value: c.id, label: c.name.pt }));

export const serviceTypeName = (id: string | null) => serviceTypeOptions.find((o) => o.value === id)?.label ?? "Sem tipo";
export const vehicleCategoryName = (id: string | null) =>
  vehicleCategoryOptions.find((o) => o.value === id)?.label ?? "Sem categoria";
