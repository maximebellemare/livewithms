import { describe, expect, it } from "vitest";
import { deriveGroundedEducationalTone } from "../../../lib/learning-ecosystem/human-centered-education/deriveGroundedEducationalTone";
import { validateEducationalSafety } from "../../../lib/learning-ecosystem/human-centered-education/validateEducationalSafety";

describe("learning ecosystem human centered education", () => {
  it("keeps educational tone grounded during heavier states", () => {
    const tone = deriveGroundedEducationalTone({
      educationalLoad: "high",
      adaptiveStatePrimary: "OVERWHELMED",
    });

    expect(tone.body.toLowerCase()).not.toMatch(/miracle|fight harder|doom/);
    expect(tone.body.toLowerCase()).toContain("helpful");
  });

  it("flags unsafe educational framing", () => {
    expect(validateEducationalSafety("Signs your MS is worsening.").valid).toBe(false);
  });
});
