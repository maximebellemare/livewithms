import { describe, expect, it } from "vitest";
import { deriveFutureIntegrityRules } from "../../../lib/platform-stewardship/intergenerational-integrity/deriveFutureIntegrityRules";
import { preserveLongTermTrust } from "../../../lib/platform-stewardship/intergenerational-integrity/preserveLongTermTrust";

describe("platform stewardship intergenerational integrity", () => {
  it("returns future integrity rules", () => {
    const result = deriveFutureIntegrityRules().join(" ").toLowerCase();

    expect(result).toContain("dignity");
    expect(result).toContain("stepping away");
  });

  it("marks trust unstable when drift rises", () => {
    const result = preserveLongTermTrust({
      governanceValid: false,
      autonomyValid: true,
      manipulationDrifted: true,
    });

    expect(result.stable).toBe(false);
  });
});
