import { describe, it, expect } from "vitest";

/**
 * Extracted trend detection logic matching GenericSparkline.
 * Tested in isolation for clarity.
 */
function computeTrend(
  plotPoints: { x: number; value: number }[],
  lowerIsBetter: boolean,
  trendThreshold: number,
): "↑" | "↓" | "→" {
  const firstHalf = plotPoints.filter((p) => p.x <= 3);
  const secondHalf = plotPoints.filter((p) => p.x > 3);
  const avg = (arr: typeof plotPoints) =>
    arr.length ? arr.reduce((s, p) => s + p.value, 0) / arr.length : null;
  const f = avg(firstHalf);
  const s = avg(secondHalf);

  let trend: "↑" | "↓" | "→" = "→";
  if (f !== null && s !== null) {
    if (lowerIsBetter) {
      if (f - s > trendThreshold) trend = "↓";
      else if (s - f > trendThreshold) trend = "↑";
    } else {
      if (s - f > trendThreshold) trend = "↑";
      else if (f - s > trendThreshold) trend = "↓";
    }
  }
  return trend;
}

describe("computeTrend", () => {
  const threshold = 0.8;

  // Higher-is-better (e.g. mood)
  describe("lowerIsBetter = false (mood)", () => {
    it("returns ↑ when second half is significantly higher", () => {
      // First half avg ~3, second half avg ~8
      const points = [
        { x: 0, value: 2 }, { x: 1, value: 3 }, { x: 2, value: 3 }, { x: 3, value: 4 },
        { x: 4, value: 7 }, { x: 5, value: 8 }, { x: 6, value: 9 },
      ];
      expect(computeTrend(points, false, threshold)).toBe("↑");
    });

    it("returns ↓ when second half is significantly lower", () => {
      const points = [
        { x: 0, value: 8 }, { x: 1, value: 9 }, { x: 2, value: 8 }, { x: 3, value: 7 },
        { x: 4, value: 3 }, { x: 5, value: 2 }, { x: 6, value: 2 },
      ];
      expect(computeTrend(points, false, threshold)).toBe("↓");
    });

    it("returns → when change is within threshold", () => {
      const points = [
        { x: 0, value: 5 }, { x: 1, value: 5 }, { x: 2, value: 5 }, { x: 3, value: 5 },
        { x: 4, value: 5.5 }, { x: 5, value: 5.5 }, { x: 6, value: 5.5 },
      ];
      expect(computeTrend(points, false, threshold)).toBe("→");
    });
  });

  // Lower-is-better (e.g. fatigue, pain)
  describe("lowerIsBetter = true (fatigue)", () => {
    it("returns ↓ (improving) when second half is lower", () => {
      const points = [
        { x: 0, value: 8 }, { x: 1, value: 7 }, { x: 2, value: 8 }, { x: 3, value: 7 },
        { x: 4, value: 3 }, { x: 5, value: 2 }, { x: 6, value: 3 },
      ];
      expect(computeTrend(points, true, threshold)).toBe("↓");
    });

    it("returns ↑ (worsening) when second half is higher", () => {
      const points = [
        { x: 0, value: 2 }, { x: 1, value: 3 }, { x: 2, value: 2 }, { x: 3, value: 3 },
        { x: 4, value: 7 }, { x: 5, value: 8 }, { x: 6, value: 7 },
      ];
      expect(computeTrend(points, true, threshold)).toBe("↑");
    });

    it("returns → when stable", () => {
      const points = [
        { x: 0, value: 4 }, { x: 1, value: 4 }, { x: 2, value: 4 }, { x: 3, value: 4 },
        { x: 4, value: 4 }, { x: 5, value: 4 }, { x: 6, value: 4 },
      ];
      expect(computeTrend(points, true, threshold)).toBe("→");
    });
  });

  describe("edge cases", () => {
    it("returns → with empty array", () => {
      expect(computeTrend([], false, threshold)).toBe("→");
    });

    it("returns → with only first-half data", () => {
      const points = [{ x: 0, value: 5 }, { x: 1, value: 6 }];
      expect(computeTrend(points, false, threshold)).toBe("→");
    });

    it("returns → with only second-half data", () => {
      const points = [{ x: 5, value: 5 }, { x: 6, value: 6 }];
      expect(computeTrend(points, false, threshold)).toBe("→");
    });

    it("handles exact threshold boundary as →", () => {
      // f=5, s=5.8 → diff=0.8, not > threshold
      const points = [
        { x: 0, value: 5 }, { x: 1, value: 5 }, { x: 2, value: 5 }, { x: 3, value: 5 },
        { x: 4, value: 5.8 }, { x: 5, value: 5.8 }, { x: 6, value: 5.8 },
      ];
      expect(computeTrend(points, false, threshold)).toBe("→");
    });
  });
});
