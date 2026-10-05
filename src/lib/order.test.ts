import { describe, expect, it } from "vitest";

import { localContent } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";

import {
  buildMessage,
  DAILY,
  emptyOrder,
  guardCount,
  type Order,
  optionsForService,
  serviceOptions,
  TRANSFER,
  TRANSPORT_ID,
  usesPeriod,
  validateOrder,
  vehicleCount,
  whatsappUrl,
} from "./order";

const pt = getDictionary("pt");
const en = getDictionary("en");

const order = (over: Partial<Order>): Order => ({ ...emptyOrder, ...over });

describe("serviceOptions", () => {
  it("abre o transporte executivo em transfer e diária, mantendo os demais serviços", () => {
    const ids = serviceOptions(localContent, pt, "pt").map((o) => o.id);
    expect(ids).toContain(TRANSFER);
    expect(ids).toContain(DAILY);
    expect(ids).not.toContain(TRANSPORT_ID);
    expect(ids).toContain("protecao-executiva");
    expect(ids).toHaveLength(localContent.serviceTypes.length + 1);
  });

  it("?servico=transporte-executivo pré-seleciona o transfer", () => {
    expect(optionsForService(TRANSPORT_ID)).toEqual([TRANSFER]);
    expect(optionsForService("eventos")).toEqual(["eventos"]);
  });
});

describe("validateOrder", () => {
  it("exige serviço, data e nome", () => {
    expect(Object.keys(validateOrder(emptyOrder, pt)).sort()).toEqual(["date", "name", "service"]);
  });

  it("aceita um pedido mínimo", () => {
    expect(validateOrder(order({ services: [TRANSFER], date: "2026-10-10", name: "Ana" }), pt)).toEqual({});
  });

  it("não aceita nome só com espaços", () => {
    expect(validateOrder(order({ services: [TRANSFER], date: "2026-10-10", name: "   " }), pt)).toHaveProperty("name");
  });
});

describe("contagens e período", () => {
  it("soma veículos e seguranças", () => {
    const o = order({ vehicles: { suv: 2, van: 1 }, guardsArmed: 1, guardsUnarmed: 2 });
    expect(vehicleCount(o)).toBe(3);
    expect(guardCount(o)).toBe(3);
  });

  it("período só não se aplica quando o pedido é apenas transfer", () => {
    expect(usesPeriod(order({ services: [TRANSFER] }))).toBe(false);
    expect(usesPeriod(order({ services: [DAILY] }))).toBe(true);
    expect(usesPeriod(order({ services: [TRANSFER, "eventos"] }))).toBe(true);
  });
});

describe("buildMessage", () => {
  const minimal = order({ services: [TRANSFER], date: "2026-10-10", name: "Ana Souza" });

  it("começa com o título em negrito e só inclui campos preenchidos", () => {
    const text = buildMessage(minimal, localContent, pt, "pt");
    const lines = text.split("\n");
    expect(lines[0]).toBe(`*${pt.message.title}*`);
    expect(text).toContain(`*${pt.message.service}:* ${pt.order.transfer.name}`);
    expect(text).toContain("*Data:* 10/10/2026");
    expect(text).toContain("*Contato:* Ana Souza");
    expect(text).not.toContain("*Origem:*");
    expect(text).not.toContain("*Obs.:*");
    expect(text).not.toContain("*Intermunicipal:*");
    expect(text).not.toContain("*Evento:*");
  });

  it("formata a data por idioma e junta hora com 'às' / 'at'", () => {
    const withTime = { ...minimal, time: "14:30" };
    expect(buildMessage(withTime, localContent, pt, "pt")).toContain("*Data:* 10/10/2026 às 14:30");
    expect(buildMessage(withTime, localContent, en, "en")).toContain(`*${en.message.date}:* Oct 10, 2026 ${en.message.at} 14:30`);
  });

  it("lista vários serviços com marcador e usa período quando há fim", () => {
    const text = buildMessage({ ...minimal, services: [TRANSFER, DAILY], endDate: "2026-10-12", time: "09:00" }, localContent, pt, "pt");
    expect(text).toContain(`*${pt.message.services}:*`);
    expect(text).toContain(`• ${pt.order.transfer.name}`);
    expect(text).toContain(`• ${pt.order.daily.name}`);
    expect(text).toContain("*Período:* 10/10/2026 às 09:00 até 12/10/2026");
    expect(text).not.toContain("*Data:*");
  });

  it("ignora a data final quando o pedido é só transfer", () => {
    const text = buildMessage({ ...minimal, endDate: "2026-10-12" }, localContent, pt, "pt");
    expect(text).toContain("*Data:* 10/10/2026");
    expect(text).not.toContain("*Período:*");
  });

  it("descreve veículos, motorista e seguranças", () => {
    const text = buildMessage(
      {
        ...minimal,
        vehicles: { suv: 2, "suv-blindado": 1 },
        driverLanguage: { choice: "pt-en", other: "" },
        guardsArmed: 1,
        guardsUnarmed: 2,
        agentLanguage: { choice: "other", other: "Mandarim" },
      },
      localContent,
      pt,
      "pt",
    );
    const suv = localContent.vehicleCategories.find((v) => v.id === "suv")!.name.pt;
    const armored = localContent.vehicleCategories.find((v) => v.id === "suv-blindado")!.name.pt;
    expect(text).toContain(`*Veículos:*\n• 2× ${suv}\n• 1× ${armored}`);
    expect(text).toContain("*Idioma do motorista:* português + inglês");
    expect(text).toContain("*Seguranças:* 1 armado + 2 desarmados");
    expect(text).toContain("*Idioma dos agentes:* português + Mandarim");
  });

  it("usa 'quero sugestão' no lugar das quantidades e omite veículos zerados", () => {
    const text = buildMessage({ ...minimal, vehiclesSuggest: true, vehicles: { suv: 3 }, guardsSuggest: true }, localContent, pt, "pt");
    expect(text).toContain(`*Veículos:* ${pt.message.suggest}`);
    expect(text).toContain(`*Seguranças:* ${pt.message.suggest}`);
    expect(text).not.toContain("3×");
    expect(text).toContain("*Idioma do motorista:*");
    expect(text).toContain("*Idioma dos agentes:*");
  });

  it("não menciona idioma do motorista nem dos agentes sem veículo ou segurança", () => {
    const text = buildMessage(minimal, localContent, pt, "pt");
    expect(text).not.toContain("*Idioma do motorista:*");
    expect(text).not.toContain("*Idioma dos agentes:*");
    expect(text).not.toContain("*Seguranças:*");
  });

  it("detalha viagem intermunicipal, evento e exposição", () => {
    const text = buildMessage(
      {
        ...minimal,
        intercity: true,
        tripNeeds: ["vehicle", "guards"],
        tripDuration: "3 dias",
        event: true,
        eventKind: "corporate",
        eventName: "Convenção anual",
        exposure: "pep",
      },
      localContent,
      pt,
      "pt",
    );
    expect(text).toContain("*Intermunicipal:* Sim");
    expect(text).toContain("*Na viagem:* veículo e segurança");
    expect(text).toContain("*Duração da viagem:* 3 dias");
    expect(text).toContain(`*Evento:* ${pt.order.eventKinds.corporate} · Convenção anual`);
    expect(text).toContain(`*Pessoa pública/PPE:* ${pt.message.exposures.pep}`);
  });

  it("intermunicipal = não aparece sem os detalhes da viagem", () => {
    const text = buildMessage({ ...minimal, intercity: false, tripDuration: "2 dias" }, localContent, pt, "pt");
    expect(text).toContain("*Intermunicipal:* Não");
    expect(text).not.toContain("*Duração da viagem:*");
  });

  it("junta nome e empresa no contato e apara espaços", () => {
    const text = buildMessage({ ...minimal, name: "  Ana  ", company: " ACME ", notes: " chegar cedo " }, localContent, pt, "pt");
    expect(text).toContain("*Contato:* Ana · ACME");
    expect(text).toContain("*Obs.:* chegar cedo");
  });
});

describe("whatsappUrl", () => {
  it("monta o link do wa.me com o texto codificado", () => {
    expect(whatsappUrl("5511999999999")).toBe("https://wa.me/5511999999999");
    expect(whatsappUrl("5511999999999", "*Olá* & até")).toBe("https://wa.me/5511999999999?text=*Ol%C3%A1*%20%26%20at%C3%A9");
  });
});
