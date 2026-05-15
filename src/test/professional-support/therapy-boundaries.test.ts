import { describe, expect, it } from "vitest";
import { preserveTherapyBoundaries } from "../../../lib/professional-support/therapy-boundaries/preserveTherapyBoundaries";
import { preventTherapeuticReplacement } from "../../../lib/professional-support/therapy-boundaries/preventTherapeuticReplacement";

describe("professional support therapy boundaries", () => {
  it("preserves therapy preparation boundaries", () => {
    const result = preserveTherapyBoundaries("This replaces therapy with therapeutic guidance.");

    expect(result.toLowerCase()).not.toContain("replaces therapy");
  });

  it("prevents therapist-replacement framing", () => {
    const result = preventTherapeuticReplacement("This can be your therapist in your pocket.");

    expect(result.toLowerCase()).not.toContain("therapist in your pocket");
  });
});
