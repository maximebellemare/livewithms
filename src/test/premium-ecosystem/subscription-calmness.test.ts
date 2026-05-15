import { describe, expect, it } from "vitest";
import { deriveBillingTransparency } from "../../../lib/premium-ecosystem/subscription-calmness/deriveBillingTransparency";
import { preserveGracefulDowngrades } from "../../../lib/premium-ecosystem/subscription-calmness/preserveGracefulDowngrades";

describe("premium ecosystem subscription calmness", () => {
  it("keeps billing transparent", () => {
    const result = deriveBillingTransparency();

    expect(result.toLowerCase()).toContain("pricing");
    expect(result.toLowerCase()).toContain("cancellation");
  });

  it("preserves graceful downgrades", () => {
    const result = preserveGracefulDowngrades();

    expect(result.toLowerCase()).toContain("core experience");
    expect(result.toLowerCase()).not.toContain("lose support");
  });
});
