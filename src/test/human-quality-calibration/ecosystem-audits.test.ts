import { describe, expect, it } from "vitest";
import { deriveHumanQualityChecks } from "../../../lib/human-quality-calibration/ecosystem-audits/deriveHumanQualityChecks";
import { validateCalmnessConsistency } from "../../../lib/human-quality-calibration/ecosystem-audits/validateCalmnessConsistency";

describe("human quality calibration ecosystem audits", () => {
  it("defines human quality checks", () => {
    expect(deriveHumanQualityChecks().length).toBeGreaterThanOrEqual(3);
  });

  it("rejects sharp urgency language", () => {
    expect(validateCalmnessConsistency(["Act now. Don't lose momentum."]).valid).toBe(false);
  });
});
