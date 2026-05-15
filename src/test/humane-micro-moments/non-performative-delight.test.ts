import { describe, expect, it } from "vitest";
import { preventDopamineUX } from "../../../lib/humane-micro-moments/non-performative-delight/preventDopamineUX";
import { preserveSubtleReliefMoments } from "../../../lib/humane-micro-moments/non-performative-delight/preserveSubtleReliefMoments";

describe("humane micro-moments non-performative delight", () => {
  it("removes dopamine-style language", () => {
    const result = preventDopamineUX("Awesome and amazing.");

    expect(result.toLowerCase()).not.toContain("awesome");
    expect(result.toLowerCase()).not.toContain("amazing");
  });

  it("preserves subtle relief instead of spectacle", () => {
    const result = preserveSubtleReliefMoments("Wow, what delight.");

    expect(result.toLowerCase()).not.toContain("wow");
    expect(result.toLowerCase()).not.toContain("delight");
  });
});
