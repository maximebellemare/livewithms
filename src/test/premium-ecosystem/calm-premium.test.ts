import { describe, expect, it } from "vitest";
import { derivePremiumValue } from "../../../lib/premium-ecosystem/calm-premium/derivePremiumValue";
import { preserveFreeUserDignity } from "../../../lib/premium-ecosystem/calm-premium/preserveFreeUserDignity";

describe("premium ecosystem calm premium", () => {
  it("derives premium value without devaluing the free tier", () => {
    const result = derivePremiumValue();

    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.summary.toLowerCase()).toContain("core app");
  });

  it("preserves dignity for free users", () => {
    const result = preserveFreeUserDignity("Without premium you can't keep up.");

    expect(result.toLowerCase()).not.toContain("can't");
  });
});
