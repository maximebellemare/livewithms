import { describe, expect, it } from "vitest";
import { reconcilePreferenceSignals } from "../../../lib/personalization/preference-memory/reconcilePreferenceSignals";
import type { PersonalizationPreferenceSnapshot } from "../../../lib/personalization/types";

function buildSnapshot(overrides?: Partial<PersonalizationPreferenceSnapshot>): PersonalizationPreferenceSnapshot {
  return {
    interactionStyle: {
      weights: {
        concise: 0.45,
        reflective: 0.7,
        structured: 0.35,
        openEnded: 0.76,
        reassuranceLight: 0.4,
        reassuranceWarm: 0.58,
        practical: 0.28,
        emotionallyReflective: 0.73,
      },
      primaryStyle: "reflective",
      confidence: 0.8,
    },
    coachTone: "reflective",
    reflectionTone: "emotionally-reflective",
    preferredCheckinWindows: ["evening"],
    engagementRhythm: "steady",
    recoveryRhythm: "gradual-return",
    reflectionDepthPreference: "deeper",
    promptStylePreference: "open-ended",
    complexityTolerance: "balanced",
    preferredDensity: "reflective",
    ...overrides,
  };
}

describe("personalization preference reconciliation", () => {
  it("holds steady when a high-confidence profile would otherwise flip too quickly", () => {
    const previous = buildSnapshot();
    const next = buildSnapshot({
      coachTone: "practical",
      reflectionTone: "practical-grounding",
      reflectionDepthPreference: "brief",
      promptStylePreference: "structured",
      interactionStyle: {
        ...previous.interactionStyle,
        confidence: 0.82,
      },
    });

    const reconciled = reconcilePreferenceSignals(previous, next);

    expect(reconciled.coachTone).toBe("reflective");
    expect(reconciled.reflectionTone).toBe("emotionally-reflective");
    expect(reconciled.reflectionDepthPreference).toBe("deeper");
    expect(reconciled.promptStylePreference).toBe("open-ended");
  });

  it("accepts the next snapshot when there is no prior profile", () => {
    const next = buildSnapshot({
      coachTone: "calm",
      reflectionTone: "observational",
      reflectionDepthPreference: "balanced",
      promptStylePreference: "gentle-observational",
    });

    expect(reconcilePreferenceSignals(null, next)).toEqual(next);
  });
});
