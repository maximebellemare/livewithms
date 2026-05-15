import { describe, expect, it } from "vitest";
import { deriveRelationalBoundaries } from "../../../lib/human-centered-ai/boundary-governance/deriveRelationalBoundaries";
import { validateAIBoundarySafety } from "../../../lib/human-centered-ai/boundary-governance/validateAIBoundarySafety";

describe("human centered ai boundary governance", () => {
  it("tightens reassurance ceilings when substitution risk is elevated", () => {
    const result = deriveRelationalBoundaries({
      substitutionRisk: "elevated",
      dependencyLanguageDetected: true,
      sensitiveTopicCount: 1,
    });

    expect(result.reassuranceCeiling).toBe(0);
    expect(result.requireOfflineOrientation).toBe(true);
  });

  it("rejects overly relational AI language", () => {
    const result = validateAIBoundarySafety("I'm always here for you. You can rely on me.");

    expect(result.valid).toBe(false);
  });
});
