import { describe, expect, it } from "vitest";
import { getLocalizedStorePrice, PREMIUM_PRICE_FALLBACK } from "../../../features/premium/display";

describe("premium display pricing", () => {
  it("uses RevenueCat localized priceString when available", () => {
    expect(
      getLocalizedStorePrice({
        plan: "monthly",
        identifier: "$rc_monthly",
        title: "Monthly",
        description: "Monthly plan",
        priceString: "CA$10.99",
        rawPackage: {},
      }),
    ).toBe("CA$10.99");
  });

  it("falls back calmly when priceString is missing", () => {
    expect(
      getLocalizedStorePrice({
        plan: "yearly",
        identifier: "$rc_annual",
        title: "Yearly",
        description: "Yearly plan",
        priceString: "",
        rawPackage: {},
      }),
    ).toBe(PREMIUM_PRICE_FALLBACK);
  });

  it("falls back calmly when package is unavailable", () => {
    expect(getLocalizedStorePrice(null)).toBe(PREMIUM_PRICE_FALLBACK);
  });
});
