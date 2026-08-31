import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const center = readFileSync(new URL("./procedure-center.tsx", import.meta.url), "utf8");

describe("/tramites smart procedures center", () => {
  it("is a dedicated route that keeps published page content as the presentation source", () => {
    expect(page).toContain("getPublishedSitePage(\"tramites\")");
    expect(page).toContain("<ProcedureCenter />");
    expect(page).not.toContain("PageContent");
  });

  it("reuses the single global COOPIA session instead of navigating to a second assistant", () => {
    expect(center).toContain("useCoopia()");
    expect(center).toContain("coopia.setOpen(true)");
    expect(center).toContain("coopia.ask(procedure.prompt)");
    expect(center).not.toContain("/#asistente");
    expect(center).not.toContain("CoopiaProvider");
  });

  it("tracks a safe selected-procedure aggregate without PII", () => {
    expect(center).toContain('eventType: "procedure_selected"');
    expect(center).toContain('source: "procedures_center"');
    expect(center).not.toMatch(/email|dni|telephone|telefono|address|domicilio/i);
  });
});
