import { describe, expect, it } from "vitest";
import { softenNarrativeFraming } from "../../../lib/journey-design/narrative-softening/softenNarrativeFraming";
import { preventTransformationLanguage } from "../../../lib/journey-design/narrative-softening/preventTransformationLanguage";
import { preventIllnessIdentityReinforcement } from "../../../lib/journey-design/identity-safety/preventIllnessIdentityReinforcement";
import { validatePersonhoodPreservation } from "../../../lib/journey-design/identity-safety/validatePersonhoodPreservation";

describe("journey narrative safety", () => {
  it("softens transformation language", () => {
    expect(preventTransformationLanguage("You overcame a difficult season.").toLowerCase()).not.toContain("overcame");
  });

  it("removes illness-identity centering", () => {
    expect(preventIllnessIdentityReinforcement("Your MS story defines you.").toLowerCase()).not.toContain("ms story");
  });

  it("flags identity-reducing copy", () => {
    const result = validatePersonhoodPreservation("This healing journey defines you.");
    expect(result.safe).toBe(false);
    expect(result.sanitizedText.toLowerCase()).not.toContain("healing journey");
  });

  it("keeps framing observational and spacious", () => {
    const text = softenNarrativeFraming("Your journey shows progress.");
    expect(text.toLowerCase()).not.toContain("journey");
    expect(text.toLowerCase()).not.toContain("progress");
  });
});

