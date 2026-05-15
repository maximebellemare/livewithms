import { describe, expect, it } from "vitest";
import { deriveLongTermPremiumValue } from "../../../lib/premium-ecosystem/sustainable-value/deriveLongTermPremiumValue";
import { preventArtificialScarcity } from "../../../lib/premium-ecosystem/sustainable-value/preventArtificialScarcity";

describe("premium ecosystem sustainable value", () => {
  it("frames premium value around depth rather than urgency", () => {
    const result = deriveLongTermPremiumValue();

    expect(result.toLowerCase()).toContain("continuity");
    expect(result.toLowerCase()).not.toContain("hurry");
  });

  it("removes scarcity framing", () => {
    const result = preventArtificialScarcity("Limited time. Best value.");

    expect(result.toLowerCase()).not.toContain("limited time");
    expect(result.toLowerCase()).not.toContain("best value");
  });
});
