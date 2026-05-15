import { describe, expect, it } from "vitest";
import { deriveAISilenceThreshold } from "../../../lib/ethical-governance/ai-restraint/deriveAISilenceThreshold";
import { deriveInterpretationLimits } from "../../../lib/ethical-governance/ai-restraint/deriveInterpretationLimits";

describe("ethical governance ai restraint", () => {
  it("reduces AI presence under elevated drift and high load", () => {
    const result = deriveAISilenceThreshold({
      adaptiveStatePrimary: "OVERWHELMED",
      emotionalLoad: "high",
      driftRisk: "elevated",
    });

    expect(result.shouldReducePresence).toBe(true);
    expect(result.maxSuggestionCount).toBe(1);
    expect(result.transparencyOnly).toBe(true);
  });

  it("tightens interpretation limits in harder states", () => {
    const result = deriveInterpretationLimits({
      adaptiveStatePrimary: "OVERWHELMED",
      driftRisk: "guarded",
    });

    expect(result.maxInterpretiveSentences).toBeLessThanOrEqual(2);
    expect(result.preserveAmbiguity).toBe(true);
  });
});
