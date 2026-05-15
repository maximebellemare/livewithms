import { describe, expect, it } from "vitest";
import { deriveReflectionTiming } from "../../../lib/reflection-surfaces/display-timing/deriveReflectionTiming";
import type { AdaptiveState } from "../../../lib/longitudinal/types";

function buildAdaptiveState(primary: AdaptiveState["primary"]): AdaptiveState {
  return {
    primary,
    signals: [primary],
    reduceUiDensity: primary !== "STABLE" && primary !== "REFLECTIVE",
    shortenPrompts: primary === "LOW_ENERGY" || primary === "OVERWHELMED",
    softenCoachTone: primary !== "STABLE",
    lowerNotificationPressure: primary === "LOW_ENERGY" || primary === "WITHDRAWN",
  };
}

describe("deriveReflectionTiming", () => {
  it("keeps reflections lighter for low-energy states", () => {
    const timing = deriveReflectionTiming({
      adaptiveState: buildAdaptiveState("LOW_ENERGY"),
      fatigueLevel: 4,
      timeOfDay: 9,
      sessionLengthSeconds: 12,
      interactionFrequency: 1,
      skippedCheckIns: 2,
    });

    expect(timing.maxCards).toBe(1);
    expect(timing.maxLength).toBe("short");
    expect(timing.suppressHeavierCards).toBe(true);
  });

  it("allows a little more room when someone seems reflective", () => {
    const timing = deriveReflectionTiming({
      adaptiveState: buildAdaptiveState("REFLECTIVE"),
      fatigueLevel: 2,
      timeOfDay: 19,
      sessionLengthSeconds: 24,
      interactionFrequency: 2,
      skippedCheckIns: 0,
    });

    expect(timing.maxCards).toBe(2);
    expect(timing.maxLength).toBe("medium");
    expect(timing.allowDeeperReflection).toBe(true);
  });

  it("stays quiet for very short sessions", () => {
    const timing = deriveReflectionTiming({
      adaptiveState: buildAdaptiveState("STABLE"),
      fatigueLevel: 2,
      timeOfDay: 14,
      sessionLengthSeconds: 2,
      interactionFrequency: 1,
      skippedCheckIns: 0,
    });

    expect(timing.shouldDisplay).toBe(false);
  });
});
