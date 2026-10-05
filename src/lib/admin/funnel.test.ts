import { describe, expect, it } from "vitest";

import { alertLabel, daysUntil, percent, proposalAlert, proposalFunnel } from "./funnel";
import { blankProposal } from "./proposals";
import type { Job, Proposal } from "./types";

const today = new Date("2026-10-05T15:00:00");

const proposal = (over: Partial<Proposal>): Proposal => ({ ...blankProposal("p", []), ...over });
const job = (over: Partial<Job>): Job => ({
  id: "j",
  clientId: null,
  serviceTypeId: null,
  startsAt: "",
  endsAt: "",
  origin: "",
  destination: "",
  status: "done",
  price: 0,
  paymentStatus: "pending",
  paidAt: "",
  notes: "",
  agentIds: [],
  vehicleIds: [],
  createdAt: "",
  ...over,
});

describe("daysUntil", () => {
  it("conta dias de calendário, ignorando a hora", () => {
    expect(daysUntil("2026-10-05", today)).toBe(0);
    expect(daysUntil("2026-10-06", today)).toBe(1);
    expect(daysUntil("2026-10-03", today)).toBe(-2);
    expect(daysUntil("2026-11-05", today)).toBe(31);
    expect(daysUntil("", today)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("proposalAlert", () => {
  it("avisa quando falta até 3 dias ou já venceu, só para rascunho e enviada", () => {
    expect(proposalAlert(proposal({ status: "sent", validUntil: "2026-10-08" }), today)).toEqual({ kind: "soon", days: 3 });
    expect(proposalAlert(proposal({ status: "sent", validUntil: "2026-10-05" }), today)).toEqual({ kind: "soon", days: 0 });
    expect(proposalAlert(proposal({ status: "draft", validUntil: "2026-10-01" }), today)).toEqual({ kind: "expired", days: -4 });
    expect(proposalAlert(proposal({ status: "sent", validUntil: "2026-10-09" }), today)).toBeNull();
    expect(proposalAlert(proposal({ status: "accepted", validUntil: "2026-10-01" }), today)).toBeNull();
    expect(proposalAlert(proposal({ status: "expired", validUntil: "2026-10-01" }), today)).toBeNull();
  });

  it("escreve o prazo em português", () => {
    expect(alertLabel({ kind: "soon", days: 0 })).toBe("vence hoje");
    expect(alertLabel({ kind: "soon", days: 1 })).toBe("vence amanhã");
    expect(alertLabel({ kind: "soon", days: 3 })).toBe("vence em 3 dias");
    expect(alertLabel({ kind: "expired", days: -1 })).toBe("venceu ontem");
    expect(alertLabel({ kind: "expired", days: -7 })).toBe("venceu há 7 dias");
  });
});

describe("proposalFunnel", () => {
  const proposals = [
    proposal({ id: "a", status: "draft" }),
    proposal({ id: "b", status: "sent" }),
    proposal({ id: "c", status: "declined" }),
    proposal({
      id: "d",
      status: "accepted",
      jobId: "j1",
      items: [{ id: "i", description: "x", detail: "", qty: 1, unit: "un.", unitPrice: 1000 }],
    }),
    proposal({
      id: "e",
      status: "accepted",
      jobId: "j2",
      items: [{ id: "i", description: "x", detail: "", qty: 2, unit: "un.", unitPrice: 500 }],
    }),
    proposal({ id: "f", status: "accepted", jobId: null }),
  ];
  const jobs = [job({ id: "j1", status: "done" }), job({ id: "j2", status: "scheduled" })];

  it("enviada → aceita → realizada, com taxas", () => {
    expect(proposalFunnel(proposals, jobs)).toEqual({
      sent: 5,
      accepted: 3,
      done: 1,
      waiting: 1,
      acceptRate: 3 / 5,
      doneRate: 1 / 3,
      acceptedValue: 2000,
    });
  });

  it("sem dados as taxas ficam indefinidas, não NaN", () => {
    const f = proposalFunnel([], []);
    expect(f.acceptRate).toBeNull();
    expect(f.doneRate).toBeNull();
    expect(percent(f.acceptRate)).toBe("–");
    expect(percent(0.333)).toBe("33%");
  });
});
