import { describe, expect, it } from "vitest";
import { deriveEmotionalFluencyLimits } from "../../../lib/future-ai-governance/intelligence-ceilings/deriveEmotionalFluencyLimits";
import { derivePredictiveLimits } from "../../../lib/future-ai-governance/intelligence-ceilings/derivePredictiveLimits";

describe("future ai governance intelligence ceilings", () => {
  it("prefers shorter responses for higher-capability tiers", () => {
    const result = deriveEmotionalFluencyLimits("advanced");

    expect(result.preferShorterResponses).toBe(true);
    expect(result.maxReflectiveSentences).toBeLessThanOrEqual(2);
  });

  it("disables predictive emotional inference", () => {
    const result = derivePredictiveLimits("multimodal");

    expect(result.allowEmotionalPrediction).toBe(false);
    expect(result.allowBehavioralTargeting).toBe(false);
  });
});
