import { describe, expect, it } from "vitest";
import { preventEmotionalConversion } from "../../../lib/premium-ecosystem/ethical-monetization/preventEmotionalConversion";
import { validateMonetizationEthics } from "../../../lib/premium-ecosystem/ethical-monetization/validateMonetizationEthics";

describe("premium ecosystem ethical monetization", () => {
  it("rejects emotionally coercive monetization", () => {
    const result = validateMonetizationEthics(["Upgrade for recovery and unlock emotional support."]);

    expect(result.valid).toBe(false);
  });

  it("softens emotional conversion copy", () => {
    const result = preventEmotionalConversion("Unlock emotional support. You need premium.");

    expect(result.toLowerCase()).not.toContain("unlock emotional support");
    expect(result.toLowerCase()).not.toContain("you need premium");
  });
});
