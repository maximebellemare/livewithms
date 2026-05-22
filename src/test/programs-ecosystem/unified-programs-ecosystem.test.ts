import { describe, expect, it } from "vitest";
import { deriveProgramsEcosystemState } from "../../../lib/programs-ecosystem";

describe("unified programs ecosystem", () => {
  it("surfaces grounding first and lowers density during overwhelm", () => {
    const state = deriveProgramsEcosystemState({
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      fatigueTrend: "steady",
      stressTrend: "elevated",
      recentSleepAverage: 7,
      brainFog: 2,
      suggestedToolId: null,
      recentToolIds: [],
      lastOpenedToolId: null,
      timeOfDay: "afternoon",
    });

    expect(state.groundingPriority).toBe("grounding-first");
    expect(state.recommendedToolIds[0]).toBe("mentally-overloaded-reset");
    expect(state.density.maxVisiblePrograms).toBeLessThanOrEqual(3);
    expect(state.reducedStimulation.active).toBe(true);
  });

  it("keeps low-energy support smaller and interruption-safe on heavier days", () => {
    const state = deriveProgramsEcosystemState({
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
      fatigueTrend: "high",
      stressTrend: "steady",
      recentSleepAverage: 5.8,
      brainFog: 4,
      suggestedToolId: "difficult-morning-support",
      recentToolIds: ["difficult-day-pacing-checklist"],
      lastOpenedToolId: "difficult-day-pacing-checklist",
      timeOfDay: "morning",
    });

    expect(state.groundingPriority).toBe("low-energy-first");
    expect(state.calmProgramFlow.interruptionSafe).toBe(true);
    expect(state.calmProgramFlow.avoidCompletionPressure).toBe(true);
    expect(state.recommendationLines.length).toBeGreaterThan(0);
    expect(state.recommendedToolIds).toContain("difficult-morning-support");
  });

  it("surfaces quieter evening audio support when sleep has felt thinner", () => {
    const state = deriveProgramsEcosystemState({
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      fatigueTrend: "steady",
      stressTrend: "steady",
      recentSleepAverage: 5.6,
      brainFog: null,
      suggestedToolId: null,
      recentToolIds: [],
      lastOpenedToolId: null,
      timeOfDay: "evening",
    });

    expect(state.groundingPriority).toBe("sleep-first");
    expect(state.reducedStimulation.preferAudio).toBe(true);
    expect(state.recommendedAudioToolIds.length).toBeGreaterThan(0);
    expect(state.recommendedToolIds).toContain("sleep-decompression-flow");
  });

  it("keeps copy free of dependency, therapy, and optimization language", () => {
    const state = deriveProgramsEcosystemState({
      lowEnergyMode: true,
      lowEnergyAssistActive: false,
      fatigueTrend: "high",
      stressTrend: "elevated",
      recentSleepAverage: 5.5,
      brainFog: 4,
      suggestedToolId: null,
      recentToolIds: [],
      lastOpenedToolId: null,
      timeOfDay: "evening",
    });

    expect(state.recommendationLines.join(" ").toLowerCase()).not.toMatch(
      /always here for you|ai companion|therapy|optimi[sz]e|transform|journey|productivity/,
    );
  });
});
