import { describe, expect, it } from "vitest";
import { deriveAdaptationLimits } from "../../../lib/personalization-intelligence/personalization-boundaries/deriveAdaptationLimits";
import { validatePersonalizationSafety } from "../../../lib/personalization-intelligence/personalization-boundaries/validatePersonalizationSafety";

describe("personalization intelligence boundaries", () => {
  it("keeps adaptation limits restrained", () => {
    const result = deriveAdaptationLimits();

    expect(result.emotionalInferenceCeiling).toBe("light");
    expect(result.allowIdentityLabeling).toBe(false);
  });

  it("rejects invasive personalization language", () => {
    const result = validatePersonalizationSafety(["We know you and exactly what you need."]);

    expect(result.valid).toBe(false);
  });
});
