import { describe, expect, it } from "vitest";
import { derivePlatformMaturity } from "../../../lib/platform-finalization/maturity-stabilization/derivePlatformMaturity";
import { preserveOperationalCalmness } from "../../../lib/platform-finalization/maturity-stabilization/preserveOperationalCalmness";

describe("platform finalization maturity stabilization", () => {
  it("marks the platform mature when compression and governance are stable", () => {
    const result = derivePlatformMaturity({
      complexityCompressed: true,
      calmnessStable: true,
      governanceStable: true,
    });

    expect(result.stable).toBe(true);
  });

  it("softens operational hype language", () => {
    const result = preserveOperationalCalmness("Move fast and ship more features through constant evolution.");

    expect(result.toLowerCase()).not.toContain("move fast");
    expect(result.toLowerCase()).not.toContain("ship more features");
  });
});
