import { describe, expect, it } from "vitest";
import { procedures } from "../../lib/procedures/catalog";
import { resolveProcedureHref } from "./procedure-links";

const virtualOffice = "https://oficina.example.coopsar.ar";
const payments = procedures.find((procedure) => procedure.id === "payments")!;
const updateData = procedures.find((procedure) => procedure.id === "update_data")!;

describe("official links for procedures", () => {
  it("resolves payments and data updates through the same published virtual-office channel", () => {
    expect(resolveProcedureHref(payments, virtualOffice)).toBe(virtualOffice);
    expect(resolveProcedureHref(updateData, virtualOffice)).toBe(virtualOffice);
  });

  it("keeps the safe payment-methods fallback when no published channel is available", () => {
    expect(resolveProcedureHref(payments, undefined)).toBe("/medios-de-pago");
    expect(resolveProcedureHref(updateData, undefined)).toBe("/medios-de-pago");
  });

  it("keeps all nine configured procedures renderable", () => {
    const visible = procedures.filter((procedure) => procedure.resolutionType === "coopia" || Boolean(resolveProcedureHref(procedure, virtualOffice)));
    expect(visible).toHaveLength(9);
    expect(visible.map((procedure) => procedure.id)).toContain("update_data");
  });
});
