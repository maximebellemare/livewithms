import { describe, expect, it } from "vitest";
import {
  formatPatternStrength,
  formatTrendPointLabel,
  getInsightDetailFallback,
  getInsightsFallbackSummary,
  getWeeklyTrendIndicator,
} from "../../../features/insights/calm-copy";

describe("insights calm copy", () => {
  it("uses calm fallback language for low-data insights", () => {
    expect(getInsightsFallbackSummary()).toBe("Patterns become clearer over time.");
    expect(getInsightDetailFallback()).toBe("A little more history can gently improve visibility.");
  });

  it("keeps weekly trend indicators observational instead of dashboard-like", () => {
    expect(getWeeklyTrendIndicator(0.6, true)).toBe("A little steadier");
    expect(getWeeklyTrendIndicator(-0.6, true)).toBe("A little lower");
    expect(getWeeklyTrendIndicator(-0.6, false)).toBe("A little lighter");
    expect(getWeeklyTrendIndicator(0.6, false)).toBe("A little heavier");
    expect(getWeeklyTrendIndicator(0.1, false)).toBe("Fairly steady");
  });

  it("uses softer pattern strength labels", () => {
    expect(formatPatternStrength(null)).toBe("—");
    expect(formatPatternStrength(0.1)).toBe("Early signal");
    expect(formatPatternStrength(0.3)).toBe("Some signal");
    expect(formatPatternStrength(0.6)).toBe("Clearer signal");
  });

  it("shortens mini-chart labels for easier scanning", () => {
    expect(formatTrendPointLabel("2026-05-02")).toBe("2");
    expect(formatTrendPointLabel("2026-05-12")).toBe("12");
  });
});
