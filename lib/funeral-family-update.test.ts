import { describe, expect, it } from "vitest";
import { funeralRelationshipLabel } from "./funeral-family-update";

describe("funeral relationship presentation", () => {
  it("uses human Spanish labels without changing stored values", () => {
    expect(funeralRelationshipLabel("spouse")).toBe("Cónyuge");
    expect(funeralRelationshipLabel("cohabitant")).toBe("Conviviente");
    expect(funeralRelationshipLabel("child")).toBe("Hijo/a");
    expect(funeralRelationshipLabel("parent")).toBe("Padre/madre");
    expect(funeralRelationshipLabel("other")).toBe("Otro");
  });
});
