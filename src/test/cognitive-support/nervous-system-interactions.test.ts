import { describe, expect, it } from "vitest";
import { deriveCalmInteractionTiming } from "../../../lib/cognitive-support/nervous-system-interactions/deriveCalmInteractionTiming";
import { deriveLowStimulationUX } from "../../../lib/cognitive-support/nervous-system-interactions/deriveLowStimulationUX";

describe("cognitive support nervous system interactions", () => {
  it("uses slower pauses for very light exercises", () => {
    const timing = deriveCalmInteractionTiming("very-light");

    expect(timing.pauseMs).toBeGreaterThanOrEqual(240);
    expect(timing.feedbackStyle).toBe("soft");
  });

  it("reduces stimulation under higher attention load", () => {
    const ux = deriveLowStimulationUX({
      intensity: "very-light",
      attentionLoad: "high",
    });

    expect(ux.reduceMotion).toBe(true);
    expect(ux.reduceChoices).toBe(true);
  });
});
