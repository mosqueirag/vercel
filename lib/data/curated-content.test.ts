import { describe, expect, it } from "vitest";
import { formatCuratedKnowledge } from "./curated-content";

describe("curated content presentation", () => {
  it("formats only the typed server-side published projection", () => {
    expect(formatCuratedKnowledge({
      services: [{ slug: "energia", name: "Energía", description: "Información publicada." }],
      articles: [{ slug: "cortes", title: "Cortes", summary: null, content: "Contenido publicado." }],
      faqs: [{ question: "¿Cómo consulto?", answer: "Desde la Oficina Virtual." }],
    })).toContain("SERVICIO: Energía");
  });

  it("does not manufacture historical knowledge when nothing is published", () => {
    expect(formatCuratedKnowledge({ services: [], articles: [], faqs: [] })).toBe("");
  });
});
