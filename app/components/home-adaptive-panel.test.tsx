import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HomeAdaptivePanel, homeAdaptivePanels } from "./home-adaptive-panel";

vi.mock("./navigation-context", () => ({
  useNavigationContext: () => ({ intent: "pay_invoice", journeyId: "journey", sessionId: "session", service: "billing" }),
}));

describe("HomeAdaptivePanel", () => {
  it("does not duplicate the payment actions that COOPIA already renders", () => {
    expect(renderToStaticMarkup(<HomeAdaptivePanel />)).toBe("");
  });

  it("keeps adaptive continuations only for intents with a distinct next step", () => {
    expect(homeAdaptivePanels.pay_invoice).toBeUndefined();
    expect(homeAdaptivePanels.energy_problem?.links).toHaveLength(3);
    expect(homeAdaptivePanels.internet_problem?.links).toHaveLength(3);
    expect(homeAdaptivePanels.fiber_coverage?.links).toHaveLength(2);
    expect(homeAdaptivePanels.fiber_signup?.links).toHaveLength(3);
  });

  it("does not retain an Office Virtual URL as an adaptive-panel source", () => {
    expect(JSON.stringify(homeAdaptivePanels)).not.toContain("cooponlineweb.com.ar");
  });
});
