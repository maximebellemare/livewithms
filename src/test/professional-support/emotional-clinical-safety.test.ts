import { describe, expect, it } from "vitest";
import { preventFearBasedSummaries } from "../../../lib/professional-support/emotional-clinical-safety/preventFearBasedSummaries";
import { softenClinicalInterpretation } from "../../../lib/professional-support/emotional-clinical-safety/softenClinicalInterpretation";

describe("professional support emotional-clinical safety", () => {
  it("softens sharper clinical interpretation", () => {
    const result = softenClinicalInterpretation("Symptoms are worsening with significant progression.");

    expect(result.toLowerCase()).not.toContain("worsening");
    expect(result.toLowerCase()).not.toContain("progression");
  });

  it("removes fear-heavy summary language", () => {
    const result = preventFearBasedSummaries("You should be concerned about this alarming change.");

    expect(result.toLowerCase()).not.toContain("concerned");
    expect(result.toLowerCase()).not.toContain("alarming");
  });
});
