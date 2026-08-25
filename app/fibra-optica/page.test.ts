import { describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("next/navigation", () => ({ permanentRedirect: redirect }));

import FiberOpticRedirect from "./page";

describe("/fibra-optica", () => {
  it("keeps the legacy URL with a permanent redirect to Internet", () => {
    FiberOpticRedirect();

    expect(redirect).toHaveBeenCalledWith("/internet");
  });
});
