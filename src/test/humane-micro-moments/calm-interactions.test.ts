import { describe, expect, it } from "vitest";
import { deriveInteractionSoftness } from "../../../lib/humane-micro-moments/calm-interactions/deriveInteractionSoftness";
import { deriveCalmTransitionTiming } from "../../../lib/humane-micro-moments/calm-interactions/deriveCalmTransitionTiming";

describe("humane micro-moments calm interactions", () => {
  it("keeps interaction softness restrained", () => {
    const result = deriveInteractionSoftness({ emphasis: "soft" });

    expect(result.buttonOpacityPressed).toBeGreaterThan(0.9);
  });

  it("uses calm transition timing", () => {
    const result = deriveCalmTransitionTiming({});

    expect(result.pressFadeMs).toBeLessThan(result.settleMs);
  });
});
