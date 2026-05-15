import { describe, expect, it } from "vitest";
import { deriveRecoverySupport } from "../../../lib/guided-programs/recovery-oriented-design/deriveRecoverySupport";
import { deriveDifficultPeriodPrograms } from "../../../lib/guided-programs/recovery-oriented-design/deriveDifficultPeriodPrograms";

describe("guided programs recovery oriented design", () => {
  it("supports recovery without completion pressure", () => {
    const result = deriveRecoverySupport({
      adaptiveStatePrimary: "WITHDRAWN",
      hasRecentDisruption: true,
    });

    expect(result.toLowerCase()).not.toMatch(/make up for lost time|complete/);
  });

  it("selects calmer tools for difficult periods", () => {
    const result = deriveDifficultPeriodPrograms({
      adaptiveStatePrimary: "OVERWHELMED",
      suggestedToolId: "one-priority-planner",
    });

    expect(result).toContain("breathing-reset");
  });
});
