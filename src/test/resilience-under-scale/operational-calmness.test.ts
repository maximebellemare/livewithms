import { describe, expect, it } from "vitest";
import { preserveCalmnessUnderFailure } from "../../../lib/resilience-under-scale/operational-calmness/preserveCalmnessUnderFailure";
import { deriveStressSafeUX } from "../../../lib/resilience-under-scale/operational-calmness/deriveStressSafeUX";

describe("resilience under scale operational calmness", () => {
  it("preserves neutral bridges when failures happen", () => {
    const result = preserveCalmnessUnderFailure({
      hasFailure: true,
      fallbackMode: "quiet",
    });

    expect(result.useSofterLanguage).toBe(true);
    expect(result.preferNeutralBridge).toBe(true);
  });

  it("reduces visible actions under stressed UX conditions", () => {
    const result = deriveStressSafeUX({
      fallbackMode: "quiet",
      conflictRisk: "elevated",
    });

    expect(result.maxVisibleActions).toBe(1);
    expect(result.suppressSecondaryInsights).toBe(true);
  });
});
