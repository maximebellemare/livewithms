import { describe, expect, it } from "vitest";
import { deriveCalmMotionPacing } from "../../../lib/humane-micro-moments/sensory-refinement/deriveCalmMotionPacing";
import { deriveLowStimulationFeedback } from "../../../lib/humane-micro-moments/sensory-refinement/deriveLowStimulationFeedback";

describe("humane micro-moments sensory refinement", () => {
  it("reduces motion under reduced settings", () => {
    const result = deriveCalmMotionPacing({ reducedMotion: true });

    expect(result.motionScale).toBeLessThan(1);
  });

  it("keeps feedback low stimulation", () => {
    expect(deriveLowStimulationFeedback({ state: "saved" })).toBe("soft-confirmation");
  });
});
