import { describe, expect, it } from "vitest";
import { deriveAmbientAdjustments } from "../../../lib/ambient-support/ambient-adaptation/deriveAmbientAdjustments";
import { deriveLowEffortSupport } from "../../../lib/ambient-support/ambient-adaptation/deriveLowEffortSupport";

describe("ambient support ambient adaptation", () => {
  it("reduces density during quieter days", () => {
    const result = deriveAmbientAdjustments({
      quieterDay: true,
      movementLighter: true,
      intensity: "very-light",
    });

    expect(result.reducePromptDensity).toBe(true);
    expect(result.shortenReflections).toBe(true);
  });

  it("keeps support low effort", () => {
    const result = deriveLowEffortSupport({
      reducePromptDensity: true,
      shortenReflections: true,
    });

    expect(result.toLowerCase()).toContain("lighter");
    expect(result.toLowerCase()).not.toContain("optimize");
  });
});
