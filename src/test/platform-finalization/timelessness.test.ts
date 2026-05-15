import { describe, expect, it } from "vitest";
import { preserveLongTermIdentity } from "../../../lib/platform-finalization/timelessness/preserveLongTermIdentity";
import { preventTrendDrivenDrift } from "../../../lib/platform-finalization/timelessness/preventTrendDrivenDrift";

describe("platform finalization timelessness", () => {
  it("preserves long-term identity when calmness stays stable", () => {
    const result = preserveLongTermIdentity({
      hasCalmTone: true,
      hasStablePhilosophy: true,
      avoidsTrendPressure: true,
    });

    expect(result.stable).toBe(true);
  });

  it("softens trend-driven language", () => {
    const result = preventTrendDrivenDrift("This viral hype cycle should reinvent constantly.");

    expect(result.toLowerCase()).not.toContain("viral");
    expect(result.toLowerCase()).not.toContain("hype cycle");
  });
});
