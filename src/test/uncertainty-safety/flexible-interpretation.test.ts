import { describe, expect, it } from "vitest";
import { deriveAlternativeContext } from "../../../lib/uncertainty-safety/flexible-interpretation/deriveAlternativeContext";
import { preventSingleCauseFraming } from "../../../lib/uncertainty-safety/flexible-interpretation/preventSingleCauseFraming";

describe("uncertainty safety flexible interpretation", () => {
  it("adds alternative context for high-variability periods", () => {
    const text = deriveAlternativeContext({
      level: "high",
      summary: null,
    });
    expect(text.toLowerCase()).toContain("may");
  });

  it("prevents single-cause framing", () => {
    const result = preventSingleCauseFraming("This happened because stress caused it.");
    expect(result.toLowerCase()).not.toContain("because");
    expect(result.toLowerCase()).not.toContain("caused");
  });
});

