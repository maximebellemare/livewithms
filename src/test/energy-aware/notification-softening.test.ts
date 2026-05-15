import { describe, expect, it } from "vitest";
import { deriveNotificationCadence } from "../../../lib/energy-aware/notification-softening/deriveNotificationCadence";
import { deriveNotificationTone } from "../../../lib/energy-aware/notification-softening/deriveNotificationTone";
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

describe("notification softening", () => {
  it("suppresses non-essential pressure for overwhelmed states", () => {
    const cadence = deriveNotificationCadence({
      adaptiveState: buildAdaptiveState("OVERWHELMED"),
      lifecycleStage: "active",
      fatigueLevel: 3,
      skippedCheckIns: 1,
      sessionLengthSeconds: 0,
      interactionFrequency: 1,
    });

    expect(cadence).toBe("SUPPRESSED");
  });

  it("keeps tone gentle for low-energy and returning users", () => {
    const tone = deriveNotificationTone({
      adaptiveState: buildAdaptiveState("LOW_ENERGY"),
      lifecycleStage: "returning",
      fatigueLevel: 4,
      skippedCheckIns: 5,
      sessionLengthSeconds: 0,
      interactionFrequency: 1,
    });

    expect(tone).toBe("gentle-nudge");
  });
});
