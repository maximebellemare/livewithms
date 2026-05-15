import { describe, expect, it } from "vitest";
import { detectCalmnessRegression } from "../../../lib/trust-observability/philosophy-telemetry/detectCalmnessRegression";
import { detectPhilosophyDrift } from "../../../lib/trust-observability/philosophy-telemetry/detectPhilosophyDrift";

describe("trust observability philosophy telemetry", () => {
  it("detects philosophy drift safely", () => {
    const result = detectPhilosophyDrift(["We miss you.", "Our analysis confirms this."]);

    expect(result.drifted).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("detects calmness regression", () => {
    const result = detectCalmnessRegression({
      emotionalSurfaceCount: 4,
      aiSuggestionCount: 3,
      notificationPressure: "high",
    });

    expect(result.drifted).toBe(true);
  });
});
