import { describe, expect, it } from "vitest";
import { deriveAmbientSupportLogic } from "../../../lib/ambient-support/calm-intelligence/deriveAmbientSupportLogic";
import { preserveHumanInterpretation } from "../../../lib/ambient-support/calm-intelligence/preserveHumanInterpretation";

describe("ambient support calm intelligence", () => {
  it("keeps quieter days very light", () => {
    const result = deriveAmbientSupportLogic({
      adaptiveStatePrimary: "LOW_ENERGY",
      quieterDay: true,
    });

    expect(result).toBe("very-light");
  });

  it("preserves human interpretation over data authority", () => {
    const result = preserveHumanInterpretation("The data knows and proves what is happening.");

    expect(result.toLowerCase()).not.toContain("data knows");
    expect(result.toLowerCase()).not.toContain("proves");
  });
});
