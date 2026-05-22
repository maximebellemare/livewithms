import { describe, expect, it } from "vitest";
import { deriveEmotionalRegulationToolkit, deriveToolkitTimeOfDay } from "../../../features/programs/toolkit";

describe("emotional regulation toolkit", () => {
  it("surfaces overwhelm support first on heavier stress days", () => {
    const toolkit = deriveEmotionalRegulationToolkit({
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      fatigueTrend: "moderate",
      stressTrend: "elevated",
      recentSleepAverage: 7,
      suggestedToolId: null,
      timeOfDay: "afternoon",
    });

    expect(toolkit.surfacedToolIds[0]).toBe("mentally-overloaded-reset");
    expect(toolkit.surfacedToolIds).toContain("reduce-stimulation-guide");
  });

  it("keeps the copy calm and free of dependency or optimization language", () => {
    const toolkit = deriveEmotionalRegulationToolkit({
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
      fatigueTrend: "high",
      stressTrend: "steady",
      recentSleepAverage: 5.5,
      suggestedToolId: "difficult-morning-support",
      timeOfDay: "morning",
    });

    expect(`${toolkit.title} ${toolkit.body}`.toLowerCase()).not.toMatch(
      /companion|always here for you|optimize|transform|healing/,
    );
    expect(toolkit.surfacedToolIds.length).toBeGreaterThan(0);
  });

  it("maps hours into gentle time-of-day buckets", () => {
    expect(deriveToolkitTimeOfDay(9)).toBe("morning");
    expect(deriveToolkitTimeOfDay(15)).toBe("afternoon");
    expect(deriveToolkitTimeOfDay(21)).toBe("evening");
  });
});
