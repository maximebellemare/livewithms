import { describe, expect, it } from "vitest";
import { deriveAdaptationReasons } from "../../../lib/trust-observability/adaptive-tracing/deriveAdaptationReasons";
import { traceAdaptiveDecisions } from "../../../lib/trust-observability/adaptive-tracing/traceAdaptiveDecisions";

describe("trust observability adaptive tracing", () => {
  it("derives internal adaptation reasons", () => {
    const reasons = deriveAdaptationReasons({
      adaptiveStatePrimary: "LOW_ENERGY",
      burden: "high",
      hasAiVisible: true,
      stackedSurfaces: 2,
    });

    expect(reasons).toEqual(expect.arrayContaining(["reduced-cognitive-demand", "high-burden-calming"]));
  });

  it("creates a lightweight adaptive trace", () => {
    const traces = traceAdaptiveDecisions({
      system: "meta-orchestration",
      adaptiveStatePrimary: "OVERWHELMED",
      burden: "high",
      decision: "reduce-interpretation",
      hasAiVisible: true,
      stackedSurfaces: 2,
    });

    expect(traces.length).toBeGreaterThan(0);
    expect(traces[0].system).toBe("meta-orchestration");
  });
});
