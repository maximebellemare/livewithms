import { describe, expect, it } from "vitest";
import { deriveResearchParticipation } from "../../../lib/ethical-insights/human-centered-research/deriveResearchParticipation";
import { validateEthicalResearchUse } from "../../../lib/ethical-insights/human-centered-research/validateEthicalResearchUse";

describe("ethical insights human-centered research", () => {
  it("keeps research opt-in and revocable", () => {
    const result = deriveResearchParticipation();

    expect(result.requiresOptIn).toBe(true);
    expect(result.revocable).toBe(true);
  });

  it("rejects exploitative research uses", () => {
    expect(validateEthicalResearchUse(["Use distress data for ad targeting."]).valid).toBe(false);
  });
});
