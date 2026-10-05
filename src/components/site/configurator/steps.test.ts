import { describe, expect, it } from "vitest";

import { getDictionary } from "@/i18n/dictionaries";
import { emptyOrder } from "@/lib/order";

import { firstInvalidStep, OPTIONAL, STEP_ERROR, STEPS, stepHint, withServices } from "./steps";

const t = getDictionary("pt").order;

describe("trilha de passos", () => {
  it("começa no serviço e termina na revisão; só os opcionais podem ser pulados", () => {
    expect(STEPS[0]).toBe("service");
    expect(STEPS.at(-1)).toBe("review");
    expect([...OPTIONAL]).toEqual(["vehicles", "guards", "context"]);
    expect(Object.keys(STEP_ERROR)).toEqual(["service", "logistics", "contact"]);
  });

  it("dica da logística só aparece quando o pedido tem período", () => {
    expect(stepHint("logistics", t, false)).toBeUndefined();
    expect(stepHint("logistics", t, true)).toBe(t.periodHint);
    expect(stepHint("contact", t, true)).toBeUndefined();
    expect(stepHint("review", t, false)).toBe(t.reviewLead);
  });
});

describe("withServices", () => {
  it("adiciona sem repetir", () => {
    const o = withServices({ ...emptyOrder, services: ["transfer"] }, ["transfer", "eventos"]);
    expect(o.services).toEqual(["transfer", "eventos"]);
  });

  it("escolher eventos já responde 'é para um evento?' se ainda não respondido", () => {
    expect(withServices(emptyOrder, ["eventos"]).event).toBe(true);
    expect(withServices({ ...emptyOrder, event: false }, ["eventos"]).event).toBe(false);
    expect(withServices(emptyOrder, ["transfer"]).event).toBeNull();
  });
});

describe("firstInvalidStep", () => {
  it("volta para o primeiro passo com erro, na ordem da trilha", () => {
    expect(firstInvalidStep({ name: "x", date: "y" })).toBe("logistics");
    expect(firstInvalidStep({ service: "x", name: "y" })).toBe("service");
    expect(firstInvalidStep({ name: "x" })).toBe("contact");
    expect(firstInvalidStep({})).toBeUndefined();
  });
});
