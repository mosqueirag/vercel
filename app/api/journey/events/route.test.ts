import { describe, expect, it } from "vitest";
import { sanitizePublicCoopiaMetadata } from "./route";

describe("sanitizePublicCoopiaMetadata", () => {
  it("keeps aggregate fields and drops free-text page context", () => {
    const metadata = sanitizePublicCoopiaMetadata({ page_type: "article", page_title: "Consulta privada", entity_id: "private-id", previous_page: "/noticias/private", outcome: "information_provided", message_length: 42 });
    expect(metadata).toEqual({ page_type: "article", outcome: "information_provided", message_length: 42 });
    expect(JSON.stringify(metadata)).not.toContain("Consulta privada");
  });

  it("allows the canonical intent label but never arbitrary user data", () => {
    const metadata = sanitizePublicCoopiaMetadata({ orchestration_intent: "fiber_interest", confidence: 0.95, message_length: 24, page_title: "España 451" });
    expect(metadata).toEqual({ confidence: 0.95, orchestration_intent: "fiber_interest", message_length: 24 });
    expect(JSON.stringify(metadata)).not.toContain("España");
  });
});
