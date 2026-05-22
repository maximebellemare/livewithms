import { describe, expect, it } from "vitest";
import { deriveSleepRecoverySupport } from "../../../features/programs/sleep-recovery";

describe("sleep recovery support", () => {
  it("surfaces evening decompression tools on heavier nights", () => {
    const result = deriveSleepRecoverySupport({
      timeOfDay: "evening",
      stressTrend: "elevated",
      fatigueTrend: "high",
      recentSleepAverage: 5.8,
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
    });

    expect(result.surfacedToolIds).toContain("sleep-decompression-flow");
    expect(result.surfacedToolIds).toContain("mentally-overloaded-tonight");
    expect(result.useCalmerNightVisuals).toBe(true);
  });

  it("keeps sleep support language free of optimization framing", () => {
    const result = deriveSleepRecoverySupport({
      timeOfDay: "evening",
      stressTrend: "steady",
      fatigueTrend: "steady",
      recentSleepAverage: 7,
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
    });

    expect(`${result.title} ${result.body}`.toLowerCase()).not.toMatch(/optimize|biohack|perfect routine|sleep intelligence|recovery system|transform/);
  });
});
