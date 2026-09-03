import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireNewsAdmin, isSameOrigin, getHistoricalEditorialCandidates, getSitePageEditorialCandidatesResult, getEditorialProposalsResult } = vi.hoisted(() => ({
  requireNewsAdmin: vi.fn(),
  isSameOrigin: vi.fn(),
  getHistoricalEditorialCandidates: vi.fn(),
  getSitePageEditorialCandidatesResult: vi.fn(),
  getEditorialProposalsResult: vi.fn(),
}));

vi.mock("../../../../lib/admin-auth", () => ({ requireNewsAdmin, isSameOrigin }));
vi.mock("../../../../lib/data/editorial-content", () => ({
  getEditorialCandidate: vi.fn(),
  getEditorialProposals: vi.fn(),
  getEditorialProposalsResult,
  getHistoricalEditorialCandidate: vi.fn(),
  getHistoricalEditorialCandidates,
  getSitePageEditorialCandidatesResult,
}));
vi.mock("../../../../lib/editorial/generator", () => ({ generateEditorialProposal: vi.fn() }));
vi.mock("../../../../lib/editorial/proposals", () => ({
  contentSourceHash: vi.fn(), editorialPromptVersion: "test", extractProtectedFacts: vi.fn(), proposalIsStale: vi.fn(), proposalNeedsValidation: vi.fn(), proposalRiskLevel: vi.fn(), sitePageTopLevelValidationFlags: vi.fn(),
}));
vi.mock("../../../../lib/editorial/publication", () => ({ canPublishEditorialProposal: vi.fn(), publicationUpdateValues: vi.fn() }));
vi.mock("../../../../lib/editorial/batch-selection", () => ({ selectProgressiveEditorialBatch: vi.fn() }));
vi.mock("../../../../lib/editorial/risk-recalculation", () => ({ editorialRiskRecalculation: vi.fn() }));
vi.mock("../../../../lib/editorial/generation-integrity", () => ({ canPersistGeneratedProposal: vi.fn(), editorialGenerationSourceHash: vi.fn() }));
vi.mock("../../../../lib/editorial/review-transition", () => ({ applySimpleEditorialProposalTransition: vi.fn() }));
vi.mock("../../../../lib/editorial/human-edit", () => ({ humanEditHash: vi.fn(), sameHumanEdit: vi.fn(), validateHumanEdit: vi.fn() }));
vi.mock("../../../../lib/editorial/site-page-generator", () => ({ generateSitePageEditorialProposal: vi.fn(), sitePageEditorialPromptVersion: "test" }));
vi.mock("../../../../lib/editorial/site-page-proposal-schema", () => ({ parseSitePageEditorialProposal: vi.fn() }));
vi.mock("../../../../lib/editorial/site-page-bridge", () => ({ applySitePageTopLevelProposal: vi.fn(), canApplySitePageEditorialProposal: vi.fn(), sitePageEditorialSourceHash: vi.fn(), sitePageTopLevelText: vi.fn() }));

import { GET } from "./route";

describe("GET /api/admin/editorial-proposals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireNewsAdmin.mockResolvedValue({ email: "admin@example.com", admin: {} });
    isSameOrigin.mockReturnValue(true);
    getHistoricalEditorialCandidates.mockResolvedValue([]);
    getSitePageEditorialCandidatesResult.mockResolvedValue({ ok: true, candidates: [] });
  });

  it("returns a valid empty proposal inventory as an empty list", async () => {
    getEditorialProposalsResult.mockResolvedValue({ ok: true, proposals: [] });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ candidates: [], proposals: [] });
  });

  it.each(["query", "invalid_response"] as const)("returns a safe 503 when the proposal inventory %s fails", async (reason) => {
    getEditorialProposalsResult.mockResolvedValue({ ok: false, reason });

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "No pudimos cargar las propuestas editoriales. Intentá actualizar el estado." });
  });
});
