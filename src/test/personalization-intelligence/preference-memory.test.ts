import { describe, expect, it } from "vitest";
import { deriveSensoryPreferences } from "../../../lib/personalization-intelligence/preference-memory/deriveSensoryPreferences";
import { deriveSupportPreferences } from "../../../lib/personalization-intelligence/preference-memory/deriveSupportPreferences";

describe("personalization intelligence preference memory", () => {
  it("keeps support preference gentle and non-creepy", () => {
    const result = deriveSupportPreferences({
      preferredSupportStyle: "practical",
      reflectionDepthPreference: "balanced",
    });

    expect(result.summary.toLowerCase()).toContain("practical");
    expect(result.summary.toLowerCase()).not.toContain("know you");
  });

  it("derives low-stimulation preferences safely", () => {
    const result = deriveSensoryPreferences({
      preferredDensity: "minimal",
      complexityTolerance: "lower",
    });

    expect(result.lowStim).toBe(true);
  });
});
