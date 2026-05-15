import { describe, expect, it } from "vitest";
import { deriveIntuitionSupport } from "../../../lib/self-trust/intuition-reinforcement/deriveIntuitionSupport";
import { generateSelfTrustPrompts } from "../../../lib/self-trust/intuition-reinforcement/generateSelfTrustPrompts";

describe("self-trust intuition reinforcement", () => {
  it("encourages intuition without replacing reflection", () => {
    const support = deriveIntuitionSupport({
      adaptiveStatePrimary: "LOW_ENERGY",
      overinterpretationRisk: "guarded",
    });

    expect(support.toLowerCase()).toContain("matters");
  });

  it("adds stronger self-trust prompts when interpretation risk is elevated", () => {
    const prompts = generateSelfTrustPrompts({
      adaptiveStatePrimary: "OVERWHELMED",
      overinterpretationRisk: "elevated",
    });

    expect(prompts.join(" ").toLowerCase()).toContain("your own sense of pacing matters too");
    expect(prompts.length).toBeGreaterThanOrEqual(2);
  });
});
