import { describe, expect, it, vi } from "vitest";
import { openCoopiaPanel } from "./internet-coopia-action";

describe("InternetCoopiaAction", () => {
  it("opens the existing global COOPIA panel without navigation", () => {
    const setOpen = vi.fn();

    openCoopiaPanel(setOpen);

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(true);
  });
});
