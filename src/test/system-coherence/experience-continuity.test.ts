import { describe, expect, it } from "vitest";
import { deriveCrossFlowConsistency } from "../../../lib/system-coherence/experience-continuity/deriveCrossFlowConsistency";
import { deriveTransitionContinuity } from "../../../lib/system-coherence/experience-continuity/deriveTransitionContinuity";

describe("system coherence experience continuity", () => {
  it("derives softer transitions for higher burden states", () => {
    const result = deriveTransitionContinuity({
      adaptiveStatePrimary: "OVERWHELMED",
      burden: "high",
      fromSurface: "today",
      toSurface: "insights",
    });

    expect(result.keepMotionSoft).toBe(true);
    expect(result.prefersShortCopy).toBe(true);
  });

  it("detects cross-flow tone inconsistency", () => {
    const result = deriveCrossFlowConsistency({
      entryTone: "grounded",
      destinationTone: "reflective",
    });

    expect(result.consistent).toBe(false);
    expect(result.preferQuietBridge).toBe(true);
  });
});
