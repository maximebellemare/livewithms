import { describe, expect, it } from "vitest";
import {
  containsUnsafeEmotionalSupportLanguage,
  deriveAdaptiveGrounding,
  deriveCalmnessLevel,
  deriveEmotionalSupportState,
  deriveLowPressureRecommendations,
  deriveReducedCognitiveLoad,
  deriveSupportDensity,
  deriveSupportIntensity,
  guardEmotionalSupportCopy,
} from "../../../lib/emotional-support-engine";

describe("emotional support engine", () => {
  it("orchestrates heavier periods toward grounding, lower density, and active simplification", () => {
    const state = deriveEmotionalSupportState({
      lowEnergyModeEnabled: true,
      recentFatigueAverage: 4.2,
      recentStressAverage: 4.1,
      recentSleepAverage: 5.8,
      brainFog: 4,
      fatigueTrend: "high",
      stressTrend: "elevated",
      interactionTolerance: "reduced",
      abandonedFlowCount: 2,
      message: "Everything feels too much and emotionally flooded right now.",
      preferredSupportStyle: "calm",
      preferredDensity: "minimal",
      engagementRhythm: "sporadic",
    });

    expect(state.intensity.level).toBe("high");
    expect(state.adaptiveGrounding.surfaceGroundingFirst).toBe(true);
    expect(state.density.level).toBe("minimal");
    expect(state.cognitiveLoad.level).toBe("active");
    expect(state.calmness.level).toBe("protective");
  });

  it("keeps adaptation subtle when signals are mild", () => {
    const intensity = deriveSupportIntensity({
      recentFatigueAverage: 2.8,
      recentStressAverage: 2.7,
      recentSleepAverage: 7.1,
      fatigueTrend: "steady",
      stressTrend: "steady",
      interactionTolerance: "steady",
      engagementRhythm: "steady",
    });
    const density = deriveSupportDensity({
      recentFatigueAverage: 2.8,
      recentStressAverage: 2.7,
      recentSleepAverage: 7.1,
      fatigueTrend: "steady",
      stressTrend: "steady",
      interactionTolerance: "steady",
      engagementRhythm: "steady",
    });
    const load = deriveReducedCognitiveLoad({
      recentFatigueAverage: 2.8,
      recentStressAverage: 2.7,
      recentSleepAverage: 7.1,
      fatigueTrend: "steady",
      stressTrend: "steady",
      interactionTolerance: "steady",
    });
    const calmness = deriveCalmnessLevel({
      recentFatigueAverage: 2.8,
      recentStressAverage: 2.7,
      recentSleepAverage: 7.1,
      fatigueTrend: "steady",
      stressTrend: "steady",
      interactionTolerance: "steady",
    });

    expect(intensity.level).toBe("steady");
    expect(density.level).toBe("standard");
    expect(load.level).toBe("none");
    expect(calmness.level).toBe("standard");
  });

  it("reduces future intensity without deterministic or reassuring language", () => {
    const grounding = deriveAdaptiveGrounding({
      recentStressAverage: 4,
      stressTrend: "elevated",
      message: "I keep spiraling about the future and what happens next.",
    });
    const recommendations = deriveLowPressureRecommendations({
      recentStressAverage: 4,
      stressTrend: "elevated",
      message: "I keep spiraling about the future and what happens next.",
    });

    expect(grounding.reduceFutureIntensity).toBe(true);
    expect(grounding.primaryRecommendation).toBe("smaller-horizon");
    expect(recommendations.join(" ").toLowerCase()).toContain("today");
    expect(recommendations.join(" ").toLowerCase()).not.toMatch(/ai detected|you are safe|everything will be okay/);
  });

  it("centrally filters dependency, therapy, and self-help drift", () => {
    const unsafe =
      "I'm always here for you with AI emotional resilience and therapy-like support. Everything will be okay.";
    const guarded = guardEmotionalSupportCopy(unsafe).toLowerCase();

    expect(containsUnsafeEmotionalSupportLanguage(unsafe)).toBe(true);
    expect(guarded).not.toMatch(/always here for you|ai emotional resilience|therapy|everything will be okay/);
  });
});
