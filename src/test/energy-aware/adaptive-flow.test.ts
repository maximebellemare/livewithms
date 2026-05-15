import { describe, expect, it } from "vitest";
import { deriveAdaptiveFlow } from "../../../lib/energy-aware/adaptive-flow/deriveAdaptiveFlow";
import type { AdaptiveState } from "../../../lib/longitudinal/types";

function buildAdaptiveState(primary: AdaptiveState["primary"]): AdaptiveState {
  return {
    primary,
    signals: [primary],
    reduceUiDensity: primary === "LOW_ENERGY" || primary === "OVERWHELMED" || primary === "WITHDRAWN",
    shortenPrompts: primary === "LOW_ENERGY" || primary === "OVERWHELMED",
    softenCoachTone: primary !== "STABLE",
    lowerNotificationPressure: primary === "LOW_ENERGY" || primary === "WITHDRAWN",
  };
}

describe("deriveAdaptiveFlow", () => {
  it("reduces density and complexity for low-energy states", () => {
    const flow = deriveAdaptiveFlow({
      adaptiveState: buildAdaptiveState("LOW_ENERGY"),
      lifecycleStage: "active",
      fatigueLevel: 4,
      skippedCheckIns: 2,
      sessionLengthSeconds: 10,
      interactionFrequency: 2,
    });

    expect(flow.density).toBe("MINIMAL");
    expect(flow.complexity).toBe("LOW");
    expect(flow.motionIntensity).toBe("REDUCED");
    expect(flow.compressedCheckIn.enabled).toBe(true);
  });

  it("allows slightly richer continuity for reflective states", () => {
    const flow = deriveAdaptiveFlow({
      adaptiveState: buildAdaptiveState("REFLECTIVE"),
      lifecycleStage: "long-term",
      fatigueLevel: 2,
      skippedCheckIns: 0,
      sessionLengthSeconds: 30,
      interactionFrequency: 2,
    });

    expect(flow.density).toBe("REFLECTIVE");
    expect(flow.reducedReflectionFlow.limitPromptCount).toBe(3);
    expect(flow.motionIntensity).toBe("STANDARD");
  });
});
