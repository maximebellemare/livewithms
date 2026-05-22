import { describe, expect, it } from "vitest";
import {
  deriveOfferingsDiagnostics,
  hasEmptyOfferingSelection,
  selectPreferredOffering,
} from "../../../lib/revenuecat/offerings";

function createPackage(identifier: string, productIdentifier: string) {
  return {
    identifier,
    product: {
      identifier: productIdentifier,
      title: productIdentifier,
      description: productIdentifier,
      priceString: "$9.99",
    },
  };
}

describe("revenuecat offerings", () => {
  it("prefers current offering when packages exist", () => {
    const offerings = {
      current: {
        identifier: "current",
        availablePackages: [
          createPackage("$rc_monthly", "livewithms_monthly"),
          createPackage("$rc_annual", "livewithms_yearly"),
        ],
      },
      all: {},
    };

    const result = selectPreferredOffering(offerings);
    expect(result.source).toBe("current");
    expect(result.selected?.identifier).toBe("current");
  });

  it("falls back to default offering when current is unavailable", () => {
    const offerings = {
      current: null,
      all: {
        default: {
          identifier: "default",
          availablePackages: [
            createPackage("$rc_monthly", "livewithms_monthly"),
            createPackage("$rc_annual", "livewithms_yearly"),
          ],
        },
      },
    };

    const result = selectPreferredOffering(offerings);
    expect(result.source).toBe("default");
    expect(result.selected?.identifier).toBe("default");
  });

  it("detects empty offerings safely", () => {
    expect(
      hasEmptyOfferingSelection({
        current: null,
        all: {},
      }),
    ).toBe(true);
  });

  it("derives diagnostics for expected packages and products", () => {
    const offering = {
      identifier: "default",
      availablePackages: [
        createPackage("$rc_monthly", "livewithms_monthly"),
        createPackage("$rc_annual", "livewithms_yearly"),
      ],
    };
    const diagnostics = deriveOfferingsDiagnostics(
      {
        current: offering,
        all: { default: offering },
      },
      offering,
    );

    expect(diagnostics.hasCurrentOffering).toBe(true);
    expect(diagnostics.hasExpectedPackages).toBe(true);
    expect(diagnostics.hasExpectedProducts).toBe(true);
  });
});
