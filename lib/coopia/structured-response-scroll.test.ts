import { describe, expect, it, vi } from "vitest";
import { scrollStructuredResponseIntoView, shouldAutoScrollStructuredResponse } from "./structured-response-scroll";

describe("structured COOPIA response scrolling", () => {
  it("scrolls only once for a new structured response", () => {
    expect(shouldAutoScrollStructuredResponse({ resultKey: "fiber:1", hasStructuredResult: true, lastScrolledResultKey: "" })).toBe(true);
    expect(shouldAutoScrollStructuredResponse({ resultKey: "fiber:1", hasStructuredResult: true, lastScrolledResultKey: "fiber:1" })).toBe(false);
  });

  it("does not scroll for feedback, passive state, or a missing structured result", () => {
    expect(shouldAutoScrollStructuredResponse({ resultKey: "handoff:1", hasStructuredResult: false, lastScrolledResultKey: "" })).toBe(false);
    expect(shouldAutoScrollStructuredResponse({ resultKey: "", hasStructuredResult: true, lastScrolledResultKey: "" })).toBe(false);
  });

  it("uses nearest smooth scrolling for the response card", () => {
    const target = { scrollIntoView: vi.fn() };
    scrollStructuredResponseIntoView(target);
    expect(target.scrollIntoView).toHaveBeenCalledOnce();
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest" });
  });
});
