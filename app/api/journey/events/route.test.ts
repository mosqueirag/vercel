import { describe, expect, it } from "vitest";
import { sanitizePublicCoopiaMetadata } from "./route";

describe("sanitizePublicCoopiaMetadata", () => {
  it("keeps aggregate fields and drops free-text page context", () => {
    const metadata = sanitizePublicCoopiaMetadata({ page_type: "article", page_title: "Consulta privada", entity_id: "private-id", previous_page: "/noticias/private", outcome: "information_provided", message_length: 42 });
    expect(metadata).toEqual({ page_type: "article", outcome: "information_provided", message_length: 42 });
    expect(JSON.stringify(metadata)).not.toContain("Consulta privada");
  });
});
