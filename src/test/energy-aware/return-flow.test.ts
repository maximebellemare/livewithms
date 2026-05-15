import { describe, expect, it } from "vitest";
import { generateReturnMessaging } from "../../../lib/energy-aware/return-flow/generateReturnMessaging";
import { deriveReturnExperience } from "../../../lib/energy-aware/return-flow/deriveReturnExperience";
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

describe("return flow messaging", () => {
  it("stays calm and non-pressuring for returning users", () => {
    const experience = deriveReturnExperience({
      adaptiveState: buildAdaptiveState("WITHDRAWN"),
      lifecycleStage: "returning",
      fatigueLevel: 3,
      skippedCheckIns: 5,
      sessionLengthSeconds: 0,
      interactionFrequency: 1,
    });
    const message = generateReturnMessaging(experience);

    expect(`${message.title} ${message.body}`.toLowerCase()).not.toMatch(/welcome back|missed|streak|catch up|get back on track/);
  });
});
