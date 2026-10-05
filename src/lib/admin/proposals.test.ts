import { describe, expect, it } from "vitest";

import { blankProposal, DEFAULT_PAYMENT, DEFAULT_TERMS, itemTotal, jobFromProposal, nextProposalNumber, proposalTotals } from "./proposals";
import type { Proposal, ProposalItem } from "./types";

const proposal = (over: Partial<Proposal>): Proposal => ({
  ...blankProposal("p", []),
  number: "2026-001",
  ...over,
});

const item = (over: Partial<ProposalItem>): ProposalItem => ({
  id: "i",
  description: "",
  detail: "",
  qty: 1,
  unit: "un.",
  unitPrice: 0,
  ...over,
});

describe("nextProposalNumber", () => {
  const at = (iso: string) => new Date(`${iso}T12:00:00`);

  it("começa em 001 no primeiro orçamento do ano", () => {
    expect(nextProposalNumber([], at("2026-03-01"))).toBe("2026-001");
  });

  it("segue o maior número do mesmo ano", () => {
    const existing = [proposal({ number: "2025-007" }), proposal({ number: "2025-008" }), proposal({ number: "2026-001" })];
    expect(nextProposalNumber(existing, at("2026-03-01"))).toBe("2026-002");
    expect(nextProposalNumber(existing, at("2025-12-31"))).toBe("2025-009");
  });

  it("preenche com zeros até três dígitos e passa de 999", () => {
    const many = Array.from({ length: 999 }, (_, i) => proposal({ number: `2026-${String(i + 1).padStart(3, "0")}` }));
    expect(nextProposalNumber(many.slice(0, 9), at("2026-06-01"))).toBe("2026-010");
    expect(nextProposalNumber(many, at("2026-06-01"))).toBe("2026-1000");
  });

  it("não repete número quando uma proposta do ano foi excluída", () => {
    // 2026-002 foi excluída: contagem + 1 daria 2026-003 de novo (e proposals.number é unique no banco)
    const existing = [proposal({ number: "2026-001" }), proposal({ number: "2026-003" })];
    expect(nextProposalNumber(existing, at("2026-06-01"))).toBe("2026-004");
  });

  it("ignora números fora do padrão", () => {
    const existing = [proposal({ number: "2026-abc" }), proposal({ number: "rascunho" })];
    expect(nextProposalNumber(existing, at("2026-06-01"))).toBe("2026-001");
  });
});

describe("totais", () => {
  it("itemTotal multiplica quantidade por valor e ignora NaN", () => {
    expect(itemTotal(item({ qty: 2, unitPrice: 1500 }))).toBe(3000);
    expect(itemTotal(item({ qty: Number.NaN, unitPrice: 10 }))).toBe(0);
  });

  it("proposalTotals aplica o desconto limitado ao subtotal", () => {
    const p = proposal({ items: [item({ qty: 2, unitPrice: 1000 }), item({ id: "i2", qty: 1, unitPrice: 500 })], discount: 300 });
    expect(proposalTotals(p)).toEqual({ subtotal: 2500, discount: 300, total: 2200 });
    expect(proposalTotals({ ...p, discount: 9999 })).toEqual({ subtotal: 2500, discount: 2500, total: 0 });
    expect(proposalTotals({ ...p, items: [], discount: 50 })).toEqual({ subtotal: 0, discount: 0, total: 0 });
  });
});

describe("blankProposal", () => {
  it("nasce em rascunho, com validade de 10 dias e condições padrão", () => {
    const p = blankProposal("novo", []);
    expect(p.id).toBe("novo");
    expect(p.status).toBe("draft");
    expect(p.number).toMatch(/^\d{4}-\d{3}$/);
    expect(p.issuedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.paymentTerms).toBe(DEFAULT_PAYMENT);
    expect(p.terms).toBe(DEFAULT_TERMS);

    const issued = new Date(`${p.issuedAt}T00:00:00`);
    const valid = new Date(`${p.validUntil}T00:00:00`);
    expect(Math.round((valid.getTime() - issued.getTime()) / 86_400_000)).toBe(10);
  });
});

describe("jobFromProposal", () => {
  it("vira serviço agendado com o total fechado e referência à proposta", () => {
    const p = proposal({
      number: "2026-004",
      title: "Escolta aeroporto",
      clientId: "cli-1",
      serviceIds: ["escolta-veicular", "eventos"],
      location: "GRU → Faria Lima",
      items: [item({ qty: 1, unitPrice: 4000 })],
      discount: 500,
    });
    const job = jobFromProposal(p, "job-9");
    expect(job).toMatchObject({
      id: "job-9",
      clientId: "cli-1",
      serviceTypeId: "escolta-veicular",
      destination: "GRU → Faria Lima",
      status: "scheduled",
      price: 3500,
      paymentStatus: "pending",
      agentIds: [],
      vehicleIds: [],
    });
    expect(job.notes).toContain("2026-004");
    expect(job.notes).toContain("Escolta aeroporto");
  });
});
