import { describe, expect, it } from "vitest";
import { deriveEmotionallySafeReports } from "../../../lib/professional-support/calm-summaries/deriveEmotionallySafeReports";
import { deriveHealthSummaries } from "../../../lib/professional-support/calm-summaries/deriveHealthSummaries";

describe("professional support calm summaries", () => {
  it("derives concise observational health summaries", () => {
    const result = deriveHealthSummaries({
      fatigueAverage: 4.1,
      stressAverage: 3.8,
      sleepAverage: 6.1,
      symptomSummaryLines: [],
      trendLines: ["Fatigue has felt a little heavier recently."],
    });

    expect(result.title).toBeTruthy();
    expect(result.lines.length).toBeGreaterThan(0);
  });

  it("keeps reports emotionally safer", () => {
    const result = deriveEmotionallySafeReports({
      trendLines: ["Symptoms have been more elevated recently."],
      questionLines: ["What supports tend to matter most right now?"],
    });

    expect(result.join(" ").toLowerCase()).not.toContain("alarm");
  });
});
